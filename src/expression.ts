import { Location } from "./error.ts";
import { Argument, FunctiFunction } from "./function.ts";

export type Expression = (
	| {
			type: ExpressionType.Function;
			args: Expression[];
			function: FunctiFunction;
	  }
	| {
			type: ExpressionType.Number;
			value: number;
	  }
	| {
			type: ExpressionType.String;
			value: string;
	  }
	| {
			type: ExpressionType.Variable;
			name: string;
	  }
	| {
			type: ExpressionType.Relocated;
			base: Expression;
	  }
	| {
			type: ExpressionType.AnonymousFunctionDeclaration;
			args: Argument[];
			body: Expression;
	  }
) & {
	location: Location;
	dependencies: FunctiFunction[];
};

export enum ExpressionType {
	Function,
	Number,
	Variable,
	String,
	Relocated,
	AnonymousFunctionDeclaration,
}
