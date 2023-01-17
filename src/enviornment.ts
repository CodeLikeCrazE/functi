import {
	Argument,
	FunctiFunction,
	FunctionType,
	NativeFunctionType,
} from "./function.ts";
import { Parser } from "./parser.ts";
import { TypeType } from "./type.ts";
import { error, Location } from "./error.ts";
import { basename } from "https://deno.land/std@0.172.0/path/mod.ts";

class Enviornment {
	constructor() {
		this.declareNativeFunction(NativeFunctionType.Add, "core/add", [
			{ type: { type: TypeType.Number }, name: "a" },
			{ type: { type: TypeType.Number }, name: "b" },
		]);
		this.declareNativeFunction(NativeFunctionType.Sub, "core/sub", [
			{ type: { type: TypeType.Number }, name: "a" },
			{ type: { type: TypeType.Number }, name: "b" },
		]);
		this.declareNativeFunction(NativeFunctionType.Mul, "core/mul", [
			{ type: { type: TypeType.Number }, name: "a" },
			{ type: { type: TypeType.Number }, name: "b" },
		]);
		this.declareNativeFunction(NativeFunctionType.Div, "core/div", [
			{ type: { type: TypeType.Number }, name: "a" },
			{ type: { type: TypeType.Number }, name: "b" },
		]);
		this.declareNativeFunction(NativeFunctionType.Cat, "core/cat", [
			{ type: { type: TypeType.Any }, name: "val" },
		]);
	}

	declareNativeFunction(
		type: NativeFunctionType,
		name: string,
		args: Argument[]
	) {
		const func = { 
			type:FunctionType.Native, 
			name, 
			args,
			native:type
		} as FunctiFunction;
		this.functions[name] = func;
	}

	importFile(path:string,location:Location) {
		if (!this.imported.includes(path)) {
			this.imported.push(path);
			let contents = "";
			try {
				contents = String.fromCharCode(...Deno.readFileSync(path));				
			} catch (readErr) {
				//error(location,`File ${basename(path)} (${path}) not found`);
				error(location,`Cannot read ${basename(path)} (${path}): ${readErr.toString()}`);
			}
			const parser = new Parser(contents,this);
			parser.path = path;
			parser.parseFile();
		}
	}

	public functions: Record<string, FunctiFunction> = {};
	public imported: string[] = [];
}

export { Enviornment };
