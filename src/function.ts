import { Location } from "./error";
import { Expression, ExpressionType } from "./expression";
import { Type, TypeType } from "./type";

/*type FunctiFunction = {
	type: FunctionType;
	name: string;
	args: Argument[];
	body?: Expression;
}	native: NativeFunctionType;*/

type FunctiFunction = {
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
);

type Argument = {
	type: Type;
	name: string;
};

enum FunctionType {
	Native,
	Custom,
}

enum NativeFunctionType {
	Add,
	Sub,
	Mul,
	Div,
	Cat,
	Call
}

export { FunctiFunction, FunctionType, NativeFunctionType, Argument };
