import { Expression, ExpressionType } from "./expression.ts";
import {
	FunctiFunction,
	FunctionType,
	NativeFunctionType,
} from "./function.ts";

export class Codegen {
	public output: Deno.FsFile;
	public genIds: Record<string, string> = {};

	public get inverseGenIdMappings() {
		const out: Record<string, string> = {};
		for (const i in this.genIds) {
			out[this.genIds[i]] = i;
		}
		return out;
	}

	constructor(output: Deno.FsFile) {
		this.output = output;
	}

	random(baseId: string) {
		const availableChars = "abcdefghijklmnopqrstuvwxyz";
		let output =
			Array.from(baseId)
				.filter((char) =>
					"abcdefghijklmnopqrstuvwxyz$123456790ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(
						char
					)
				)
				.join("") + "$";
		do {
			output +=
				availableChars[
					Math.floor(Math.random() * (availableChars.length - 1))
				];
		} while (this.inverseGenIdMappings[output]);
		return output;
	}

	id(str: string) {
		if (!this.genIds[str]) {
			this.genIds[str] = this.random(str);
		}
		return this.genIds[str];
	}

	write(str:string) {
		this.output.writeSync(new Uint8Array(Array.from(str).map(s => s.charCodeAt(0))));
	}

	writeMainCall() {
		this.write(`${this.id("main")}()`);
	}

	writeFunction(func: FunctiFunction) {
		switch (func.type) {
			case FunctionType.Custom:
				{
					this.write(`function ${this.id(func.name)}(`);
					let isFirst = true;
					for (const arg of func.args) {
						if (!isFirst) {
							this.write(",");
						}
						this.write(arg.name);
						isFirst = false;
					}
					this.write(`){ return `);
					this.writeExpression(func.body);
					this.write(`}`);
				}
				return;
			case FunctionType.Native:
				switch (func.native) {
					case NativeFunctionType.Add:
						this.write(
							`function ${this.id(
								func.name
							)}($a,$b){return $a + $b}`
						);
						break;
					case NativeFunctionType.Sub:
						this.write(
							`function ${this.id(
								func.name
							)}($a,$b){return $a - $b}`
						);
						break;
					case NativeFunctionType.Mul:
						this.write(
							`function ${this.id(
								func.name
							)}($a,$b){return $a * $b}`
						);
						break;
					case NativeFunctionType.Div:
						this.write(
							`function ${this.id(
								func.name
							)}($a,$b){return $a / $b}`
						);
						break;
					case NativeFunctionType.Cat:
						this.write(
							`function ${this.id(
								func.name
							)}($str){console.log($str)}`
						);
				}
				return;
		}
	}

	writeExpression(expr: Expression) {
		switch (expr.type) {
			case ExpressionType.Function:
				{
					this.write(`${this.id(expr.function.name)}(`);
					let isFirst = true;
					for (const subExpr of expr.args) {
						if (!isFirst) {
							this.write(",");
						}
						this.writeExpression(subExpr);
						isFirst = false;
					}
					this.write(")");
				}
				return;
			case ExpressionType.Number:
				this.write(expr.value.toString());
				return;
			case ExpressionType.Variable:
				this.write(expr.name);
				return;
			case ExpressionType.String:
				this.write(JSON.stringify(expr.value));
				return;
			case ExpressionType.Relocated:
				this.writeExpression(expr.base);
				return;
			case ExpressionType.AnonymousFunctionDeclaration: {
				this.write(`function (`);
				let isFirst = true;
				for (const subExpr of expr.args) {
					if (!isFirst) {
						this.write(",");
					}
					this.write(subExpr.name);
					isFirst = false;
				}
				this.write("){ return");
				this.writeExpression(expr.body);
				this.write("}");
				return;
			}
			default:
				console.log(expr);
		}
	}
}
