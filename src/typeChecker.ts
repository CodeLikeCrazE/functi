import { delayedError, error } from "./error";
import { Expression, ExpressionType } from "./expression";
import { FunctiFunction, FunctionType, NativeFunctionType } from "./function";
import { Type, TypeType } from "./type";

export function checkFunction(fn:FunctiFunction) {
	if (fn.type == FunctionType.Custom) {
		const scope: Record<string,Type> = {};
		for (const arg of fn.args) {
			scope[arg.name] = arg.type;
		}
		checkExpression(fn.body,scope);
	}
}

export function checkExpression(
	expression: Expression,
	scope: Record<string, Type>
) {
	if (expression.type == ExpressionType.Function) {
		for (const index in expression.function.args) {
			if (
				!canCast(
					getReturnType(expression.args[index], scope),
					expression.function.args[index].type
				)
			) {
				delayedError(
					expression.args[index].location,
					`Cannot cast from ${typeName(
						getReturnType(expression.args[index], scope)
					)} to ${typeName(expression.function.args[index].type)}`
				);
			}
		}
	}
}

export function typeName(type: Type):string {
	switch (type.type) {
		case TypeType.Any:
			return "any";
		case TypeType.Boolean:
			return "boolean";
		case TypeType.Null:
			return "null";
		case TypeType.Number:
			return "number";
		case TypeType.Object:
			return "object";
		case TypeType.String:
			return "string";
		case TypeType.Array:
			return `[${typeName(type.subType)}]`;
		case TypeType.Function:
			return `Function ${type.args.map(typeName).join(", ")} => ${typeName(type.returnType)}`;
	}
}

export function canCast(src: Type, dest: Type): boolean {
	//TODO: FIXME THIS WILL PROBLABLY BREAK EVENTUALLY
	if (JSON.stringify(src) == JSON.stringify(dest)) {
		return true;
	}
	if (dest.type == TypeType.Any) {
		return true;
	}
	if (src.type == TypeType.Array && dest.type == TypeType.Array) {
		return canCast(src.subType, dest.subType);
	}
	return false;
}

export function getReturnType(
	expression: Expression,
	scopeVars: Record<string, Type>
): Type {
	switch (expression.type) {
		case ExpressionType.Function:
			if (expression.function.type == FunctionType.Native) {
				switch (expression.function.native) {
					case NativeFunctionType.Add:
						return {
							type: TypeType.Number,
						} as Type;

					case NativeFunctionType.Sub:
						return {
							type: TypeType.Number,
						} as Type;
					case NativeFunctionType.Mul:
						return {
							type: TypeType.Number,
						} as Type;
					case NativeFunctionType.Div:
						return {
							type: TypeType.Number,
						} as Type;
					case NativeFunctionType.Cat:
						return {
							type: TypeType.Null,
						} as Type;
					case NativeFunctionType.Call:
						const func = getReturnType(expression.args[0],scopeVars);
						if (func.type != TypeType.Function) {
							delayedError(expression.location,"Call expects a function");
							return {
								type:TypeType.Null
							};
						}
						let inArgs = expression.args.map(arg => getReturnType(arg,scopeVars));
						let funcArgs = func.args;
						if (inArgs.length != funcArgs.length) {
							delayedError(expression.location,"Args length mismatch");
						}
						for (let i = 0; i < inArgs.length; i++) {
							if (!canCast(inArgs[i],funcArgs[i])) {
								delayedError(expression.args[i].location,"Arg type mismatch");
							}
						}
						
						return func.returnType;
				}
			}
			return getReturnType(expression.function.body, scopeVars);
		case ExpressionType.Variable:
			const varValue = scopeVars[expression.name];
			if (!varValue) {
				error(
					expression.location,
					`${varValue} does not exist in the current scope`
				);
			}
			return varValue;
		case ExpressionType.Number:
			return {
				type: TypeType.Number,
			} as Type;
		case ExpressionType.String:
			return {
				type: TypeType.String,
			} as Type;
		case ExpressionType.Relocated:
			return getReturnType(expression.base,scopeVars);
		case ExpressionType.AnonymousFunctionDeclaration:
			const newScope = structuredClone(scopeVars);
			for (const arg of expression.args) {
				newScope[arg.name] = arg.type;
			}
			return {
				type: TypeType.Function,
				returnType: getReturnType(expression.body,newScope),
				args:expression.args.map(arg => arg.type)
			} as Type;
	}
}
