import { Stream, Writable } from "stream";
import { Enviornment } from "./enviornment";
import { Expression, ExpressionType } from "./expression";
import { FunctiFunction, FunctionType, NativeFunctionType } from "./function";

export class Codegen {
	public output: Writable;
	public genIds: Record<string, string> = {};

	public get inverseGenIdMappings() {
		const out:Record<string,string> = {};
		for (const i in this.genIds) {
			out[this.genIds[i]] = i;
		}
		return out;
	}

	constructor(output: Writable) {
		this.output = output;
	}

	random(baseId:string) {
		const availableChars = "abcdefghijklmnopqrstuvwxyz";
		let output = Array.from(baseId).filter(char => 'abcdefghijklmnopqrstuvwxyz$123456790ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(char)).join("") + "$";
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

	writeMainCall() {
		this.output.write(`${this.id('main')}()`);
	}

	writeFunction(func: FunctiFunction) {
		switch (func.type) {
			case FunctionType.Custom:
				//TODO: WRITE ARGS
				this.output.write(`function ${this.id(func.name)}(`);
				let isFirst = true;
				for (const arg of func.args) {
					if (!isFirst) {
						this.output.write(",");
					}
					this.output.write(arg.name);
					isFirst = false;
				}
				this.output.write(`){ return `);
				this.writeExpression(func.body);
				this.output.write(`}`);
				return;
			case FunctionType.Native:
				switch (func.native) {
					case NativeFunctionType.Add:
						this.output.write(
							`function ${this.id(func.name)}($a,$b){return $a + $b}`
						);
						break;
					case NativeFunctionType.Sub:
						this.output.write(
							`function ${this.id(func.name)}($a,$b){return $a - $b}`
						);
						break;
					case NativeFunctionType.Mul:
						this.output.write(
							`function ${this.id(func.name)}($a,$b){return $a * $b}`
						);
						break;
					case NativeFunctionType.Div:
						this.output.write(
							`function ${this.id(func.name)}($a,$b){return $a / $b}`
						);
						break;
					case NativeFunctionType.Cat:
						this.output.write(
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
					this.output.write(`${this.id(expr.function.name)}(`);
					let isFirst = true;
					for (const subExpr of expr.args) {
						if (!isFirst) {
							this.output.write(",");
						}
						this.writeExpression(subExpr);
						isFirst = false;
					}
					this.output.write(")");
				}
				return;
			case ExpressionType.Number:
				this.output.write(expr.value.toString());
				return;
			case ExpressionType.Variable:
				this.output.write(expr.name);
				return;
			case ExpressionType.String:
				this.output.write(JSON.stringify(expr.value));
				return;
			case ExpressionType.Relocated:
				this.writeExpression(expr.base);
				return;
			case ExpressionType.AnonymousFunctionDeclaration:
				{
					this.output.write(`function (`);
					let isFirst = true;
					for (const subExpr of expr.args) {
						if (!isFirst) {
							this.output.write(",");
						}
						this.output.write(subExpr.name);
						isFirst = false;
					}
					this.output.write('){ return');
					this.writeExpression(expr.body);
					this.output.write('}');
					return;
				}
			default:
				console.log(expr);
		}
	}
}
