import { Codegen } from "./codegen";
import { Enviornment } from "./enviornment";
import { Parser } from "./parser";
import { createWriteStream, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { analyzeExpression } from "./dependencyAnalysis";
import { checkFunction } from "./typeChecker";
import { FunctionType } from "./function";
import { killIfShould } from "./error";
import { inspect } from "util";

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
const codegen = new Codegen(createWriteStream(join(__dirname, "output.js")));

for (const dependency of enviornment.functions.main.body.dependencies) {
	codegen.writeFunction(dependency);
}
codegen.writeMainCall();
