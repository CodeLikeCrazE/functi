import { Expression, ExpressionType } from "./expression";
import { FunctionType } from "./function";

export function analyzeExpression(expr: Expression) {
	switch (expr.type) {
		case ExpressionType.Function:
			if (!expr.dependencies.includes(expr.function)) {
				expr.dependencies.push(expr.function);
			}
			if (expr.function.type == FunctionType.Custom) {
				analyzeExpression(expr.function.body);
				for (const dependency of expr.function.body.dependencies) {
					if (!expr.dependencies.includes(dependency)) {
						expr.dependencies.push(dependency);
					}
				}
			}
			return;
		case ExpressionType.Variable:
			return;
		case ExpressionType.String:
			return;
		case ExpressionType.Number:
			return;
	}
}
