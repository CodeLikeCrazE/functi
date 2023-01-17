import { Location } from "./error.ts";
import { Expression, ExpressionType } from "./expression.ts";
import { Type, TypeType } from "./type.ts";

/*type FunctiFunction = {
	type: FunctionType;
	name: string;
	args: Argument[];
	body?: Expression;
}	native: NativeFunctionType;*/

export type FunctiFunction = {
	name: string;
	args: Argument[];
	location: Location;
} & (
	| {
			type: FunctionType.Custom;
			body: Expression;
	  }
	| {
			type: FunctionType.Native;
			native: NativeFunctionType;
	  }
	| {
		type: FunctionType.Partial
	}
);

export type Argument = {
	type: Type;
	name: string;
};

export enum FunctionType {
	Native,
	Custom,
	Partial
}

export enum NativeFunctionType {
	Add,
	Sub,
	Mul,
	Div,
	Cat,
	Call
}
