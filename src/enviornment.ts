import {
	Argument,
	FunctiFunction,
	FunctionType,
	NativeFunctionType,
} from "./function";
import { Parser } from "./parser";
import { TypeType } from "./type";
import { readFileSync, existsSync } from 'fs';
import { error, Location } from "./error";

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
			if (!existsSync(path)) {
				error(location,"Cannot find file " + path);
			}
			const parser = new Parser(readFileSync(path).toString(),this);
			parser.path = path;
			parser.parseFile();
		}
	}

	public functions: Record<string, FunctiFunction> = {};
	public imported: string[] = [];
}

export { Enviornment };
