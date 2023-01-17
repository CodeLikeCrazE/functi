import { Codegen } from "./codegen.ts";
import { Enviornment } from "./enviornment.ts";
import { join } from "https://deno.land/std@0.172.0/path/mod.ts";
import { analyzeExpression } from "./dependencyAnalysis.ts";
import { checkFunction } from "./typeChecker.ts";
import { FunctionType } from "./function.ts";
import { killIfShould } from "./error.ts";
import { fromMeta } from "https://x.nest.land/dirname_deno@0.3.0/mod.ts";

const { __dirname, __filename } = fromMeta(import.meta);

console.log("⚛ Creating enviornment");
const enviornment = new Enviornment();

console.log("📖 Parsing");
enviornment.importFile(join(__dirname, "demo.functi"), {
	code: "",
	location: 0,
});
killIfShould();

if (!enviornment.functions.main) {
	throw new Error("Must have main function");
}

if (enviornment.functions.main.args.length > 0) {
	throw new Error("Main may not take arguments");
}
if (enviornment.functions.main.type != FunctionType.Custom) {
	throw new Error(
		"Main should not be able to be a native function. This is odd..."
	);
}

console.log("🧠 Analyzing dependencies");
analyzeExpression(enviornment.functions.main.body);

if (
	!enviornment.functions.main.body.dependencies.includes(
		enviornment.functions.main
	)
) {
	enviornment.functions.main.body.dependencies.push(
		enviornment.functions.main
	);
}

console.log("💭 Typechecking");

for (const fn in enviornment.functions) {
	checkFunction(enviornment.functions[fn]);
}

killIfShould();

console.log("✏ Codegen");
const codegen = new Codegen(await Deno.open(join(__dirname, "output.js"),{
	write:true,
	create:true,
}));

for (const dependency of enviornment.functions.main.body.dependencies) {
	codegen.writeFunction(dependency);
}
codegen.writeMainCall();
