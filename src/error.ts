import { basename } from "path";

export type Location = {
	path?: string;
	code: string;
	location: number;
};

export let errors:string[] = [];

export function unformattedLocationText(loc: Location) {
	return `(${loc.path ? basename(loc.path) : "anonymous"}/${
		loc.code.slice(0, loc.location).split("\n").length
	}:${
		loc.code.slice(0, loc.location).split("\n")[
			loc.code.slice(0, loc.location).split("\n").length - 1
		].length
	})`;
}

export function locationText(loc: Location) {
	return `\x1b[31;1m` + unformattedLocationText(loc) + `\x1b[0m`;
}

export function delayedError(loc:Location, text:string) {
	errors.push(`${locationText(loc)}: ${text}`);
}

export function error(loc:Location, text:string) {
	delayedError(loc,text);
	process.exit(1);
}

export function killIfShould() {
	if (errors.length > 0) {
		console.log();
		console.clear();
		console.log("COMPILATION EXITED WITH ERRORS");
		console.log("-".repeat(process.stdout.columns));
		for (const error of errors) {
			console.log(error);
		}
		process.exit(1);
	}
}
