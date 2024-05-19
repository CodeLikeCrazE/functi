import { Enviornment } from "./enviornment.ts";
import { Expression, ExpressionType } from "./expression.ts";
import {
	Argument,
	FunctiFunction,
	FunctionType,
	NativeFunctionType,
} from "./function.ts";
import { Type, TypeType } from "./type.ts";
import { join } from "https://deno.land/std@0.172.0/path/mod.ts";
import { delayedError as error, Location } from "./error.ts";
import { fromMeta } from "https://x.nest.land/dirname_deno@0.3.0/mod.ts";

const { __dirname, __filename } = fromMeta(import.meta);

type char = string;

class Parser {
	constructor(code: string, enviornment: Enviornment) {
		this.enviornment = enviornment;
		this.code = code;
		this.index = 0;
	}

	// vars

	code: string;
	index: number;
	path?: string;

	enviornment: Enviornment;
	abortParsingFunctionArguments=false;
	
	debugLogHook = (text: string) => {
		console.log(text);
	};

	// primitive functions

	peek(chars: number) {
		const out = this.code.substring(this.index, this.index + chars);
		if (out.length != chars) {
			error(
				this.getLocation(),
				"Tried to read " +
					chars +
					" characters but could only read " +
					out.length
			);
		}
		return out;
	}

	seek(chars: number) {
		this.index += chars;
	}

	read(chars: number) {
		const out = this.peek(chars);
		this.seek(chars);
		return out;
	}

	eof() {
		return this.index >= this.code.length;
	}

	// basic functions

	isWhitespace(str: char) {
		if (str.length != 1) {
			throw new TypeError("Internal Error: Not a char");
		}
		return " \n\t\r".includes(str);
	}

	isSeperator(str: char) {
		if (str.length != 1) {
			throw new TypeError("Internal Error: Not a char");
		}
		return "[]{}".includes(str);
	}

	isWhitespaceNext() {
		if (this.eof()) {
			error(this.getLocation(), "Unexpected EOF");
		}
		return this.isWhitespace(this.peek(1));
	}

	isSeperatorNext() {
		return (
			this.eof() ||
			this.isWhitespaceNext() ||
			this.isSeperator(this.peek(1))
		);
	}

	consumeWhitespace() {
		while (!this.eof() && this.isWhitespaceNext()) {
			this.seek(1);
		}
	}

	readToken() {
		this.consumeWhitespace();
		let out = "";
		while (!this.isSeperatorNext()) {
			out += this.read(1);
		}
		return out;
	}

	debugLog(text: string) {
		this.consumeWhitespace();
		console.log(
			`${text}${" ".repeat(40 - text.length)}: ${this.code.slice(
				this.index
			)/*.split("\n")[0]*/}`
		);
	}

	readNumber() {
		return parseFloat(this.readToken());
	}

	// more advanced functions

	parseFile() {
		this.debugLog(`parsing file`);
		while (!this.eof()) {
			this.consumeWhitespace();
			this.parseChunk();
		}
		this.debugLog(`eof`);
	}

	parseChunk() {
		this.consumeWhitespace();
		const type = this.readToken();

		this.consumeWhitespace();

		switch (type) {
			case "function":
				this.debugLog(`reading function`);
				this.parseFunction();
				break;
			case "import":
				{
				this.debugLog(`importing`);
				this.consumeWhitespace();
				const loc = this.getLocation();
				const toImport = this.parseString();
				if (toImport.startsWith("std@")) {
					this.enviornment.importFile(
						join(
							__dirname,
							"std",
							toImport.substring(4) + ".functi"
						),
						loc
					);
					return;
				}
				if (!this.path) {
					error(
						this.getLocation(),
						"Anonymous files cannot import from other than std"
					);
				} else {
					this.enviornment.importFile(
						join(this.path, "../", toImport),
						loc
					);
				}
				break;
				}
			default:
				error(
					this.getLocation(),
					"Unexpected top level declaration " + type
				);
		}
	}

	getLocation(): Location {
		return {
			path: this.path,
			code: this.code,
			location: this.index,
		};
	}

	parseFunction() {
		const name = this.readToken();
		const args: Argument[] = [];
		this.consumeWhitespace();
		const loc = this.getLocation();
		while (this.peek(2) != "=>" && !this.abortParsingFunctionArguments) {
			this.debugLog(`parsing function argument definition`);
			args.push(this.parseArgument());
			this.consumeWhitespace();
		}
		if (this.abortParsingFunctionArguments) {
			this.abortParsingFunctionArguments = false;
			return;
		}
		this.seek(2);
		// we partially declare the function to allow for recursion
		const fn = {
			type: FunctionType.Partial,
			name,
			args,
		} as FunctiFunction;
		if (this.enviornment.functions[fn.name]) {
			error(this.getLocation(), `Function ${fn.name} already exists`);
		}
		this.enviornment.functions[fn.name] = fn;
		this.debugLog(`reading function body`);
		const scopeVars: Record<string, Expression> = {};
		for (const arg of args) {
			scopeVars[arg.name] = {
				type: ExpressionType.Variable,
				name: arg.name,
				dependencies: [],
				location: this.getLocation(),
			};
		}
		this.enviornment.functions[fn.name] = {
			type: FunctionType.Custom,
			name,
			args,
			body: this.parseExpression(scopeVars),
			location: loc,
		};
	}

	parseAnonymousFunction(): FunctiFunction {
		const args: Argument[] = [];
		this.consumeWhitespace();
		const loc = this.getLocation();
		while (this.peek(2) != "=>") {
			this.debugLog(`parsing function argument definition`);
			args.push(this.parseArgument());
			this.consumeWhitespace();
		}
		this.seek(2);
		this.debugLog(`reading function body`);
		const scopeVars: Record<string, Expression> = {};
		for (const arg of args) {
			scopeVars[arg.name] = {
				type: ExpressionType.Variable,
				name: arg.name,
				dependencies: [],
				location: this.getLocation(),
			};
		}
		return {
			type: FunctionType.Custom,
			name: "anonymous",
			args,
			body: this.parseExpression(scopeVars),
			location: loc,
		};
	}

	parseString() {
		if (!"'`\"".includes(this.peek(1))) {
			error(this.getLocation(), "Expected string");
		}
		const begin = this.read(1);
		let strValue = "";
		while (this.peek(1) != begin) {
			strValue += this.read(1);
		}
		this.seek(1);
		return strValue;
	}

	parseExpression(scopeVars: Record<string, Expression>): Expression {
		this.consumeWhitespace();
		const loc = this.getLocation();
		if ("'`\"".includes(this.peek(1))) {
			return {
				type: ExpressionType.String,
				value: this.parseString(),
				dependencies: [],
				location: loc,
			};
		}
		const operation = this.readToken();
		{
			const asNumber = parseFloat(operation);
			if (!Number.isNaN(asNumber)) {
				this.debugLog(`reading number`);
				return {
					type: ExpressionType.Number,
					value: asNumber,
					dependencies: [],
					location: loc,
				};
			}
		}
		this.debugLog(`reading function of type ${operation}`);
		if (operation == "anon") {
			const fn = this.parseAnonymousFunction();
			if (fn.type != FunctionType.Custom) {
				throw new Error("Oh shoot!");
			}
			return {
				type: ExpressionType.AnonymousFunctionDeclaration,
				args: fn.args,
				body: fn.body,
				location: loc,
				dependencies: [],
			};
		}
		if (scopeVars[operation]) {
			return {
				type: ExpressionType.Relocated,
				base: scopeVars[operation],
				location: loc,
				dependencies: [],
			};
		}
		if (!this.enviornment.functions[operation]) {
			error(
				loc,
				operation +
					" is not a function nor is it defined in the current scope"
			);
			//@ts-ignore
			return;
		}
		const fn = this.enviornment.functions[operation];
		let output: Expression = {
			type: ExpressionType.Function,
			function: fn,
			args: [],
			dependencies: [],
			location: loc,
		};
		for (let i = 0; i < fn.args.length; i++) {
			this.consumeWhitespace();
			this.debugLog(`parsing arg index ${i}`);
			output.args.push(this.parseExpression(scopeVars));
		}
		this.consumeWhitespace();
		return output;
	}

	parseArgument(): Argument {
		const type = this.parseType();
		this.consumeWhitespace();
		const name = this.readToken();
		this.consumeWhitespace();
		return {
			name,
			type,
		};
	}

	parseType(): Type {
		this.debugLog(`reading type annotation`);
		if (this.peek(1) == "[") {
			this.debugLog(`reading array`);
			this.seek(1);
			this.consumeWhitespace();
			const out: {
				type: TypeType.Array;
				subType: Type;
			} = {
				type: TypeType.Array,
				subType: this.parseType(),
			};
			this.consumeWhitespace();
			if (this.read(1) != "]") {
				error(this.getLocation(), "Expected ]");
			}
			return out;
		}
		this.debugLog(`reading non array type`);
		const type = this.readToken();
		this.debugLogHook(`type is ${type}`);
		switch (type) {
			case "number":
				return {
					type: TypeType.Number,
				};
			case "boolean":
				return {
					type: TypeType.Boolean,
				};
			case "string":
				return {
					type: TypeType.String,
				};
			case "null":
				return {
					type: TypeType.Null,
				};
			case "any":
				return {
					type: TypeType.Any,
				};
			case "anon":
				{
					const args: Type[] = [];
					this.consumeWhitespace();
					while (this.peek(2) != "=>") {
						this.debugLog(`parsing anonymous function typedef arg`);
						args.push(this.parseType());
						this.consumeWhitespace();
					}
					this.seek(2);
					this.consumeWhitespace();
					this.debugLog(`parsing anon func type return type`);
					const returnType = this.parseType();
					return {
						type: TypeType.Function,
						args,
						returnType
					}
				}
			default:
				this.abortParsingFunctionArguments = true;
				error(this.getLocation(), "Unexpected type " + type);
				return {
					type: TypeType.Null,
				};
		}
	}
}

export { Parser };
