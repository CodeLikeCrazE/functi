import { Codegen } from "./codegen.ts";
import { Enviornment } from "./enviornment.ts";
import { Parser } from "./parser.ts";
import { join } from "https://deno.land/std@0.172.0/path/mod.ts";
import { analyzeExpression } from "./dependencyAnalysis.ts";
import { checkFunction } from "./typeChecker.ts";
import { FunctionType } from "./function.ts";
import { killIfShould } from "./error.ts";

console.log("⚛ Creating enviornment");
const enviornment = new Enviornment();

console.log("📖 Parsing");
enviornment.importFile(join(new URL('', import.meta.url).pathname, "demo.functi"), {
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
if (enviornment.functions.main.type == FunctionType.Native) {
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
const codegen = new Codegen(await Deno.open(join(new URL('', import.meta.url).pathname, "output.js")));

for (const dependency of enviornment.functions.main.body.dependencies) {
	codegen.writeFunction(dependency);
}
codegen.writeMainCall();
