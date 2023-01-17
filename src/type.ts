import { Argument } from "./function.ts";

export type Type = {
	type: TypeType.String | TypeType.Number | TypeType.Boolean | TypeType.Null | TypeType.Any;
} | {
	type: TypeType.Object;
	data: Record<string, Type>;
} | {
	type: TypeType.Array;
	subType: Type;
} | {
	type: TypeType.Function;
	args: Type[];
	returnType: Type;
};


export enum TypeType {
	Array,
	Object,
	String,
	Number,
	Boolean,
	Null,
	Any,
	Function
}
