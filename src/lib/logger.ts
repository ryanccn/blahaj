import { blue, dim, green, red, yellow } from "kleur/colors";

export class Logger {
	prefixSuffix?: string;

	constructor(prefix?: string) {
		this.prefixSuffix = prefix ? dim(`:${prefix}`) : "";
	}

	info(...a: unknown[]) {
		console.log(`${blue("info")}${this.prefixSuffix} ${dim("·")}`, ...a);
	}

	success(...a: unknown[]) {
		console.log(`${green("success")}${this.prefixSuffix} ${dim("·")}`, ...a);
	}

	warn(...a: unknown[]) {
		console.error(`${yellow("warn")}${this.prefixSuffix} ${dim("·")}`, ...a);
	}

	error(...a: unknown[]) {
		console.error(`${red("error")}${this.prefixSuffix} ${dim("·")}`, ...a);
	}
}

export const defaultLogger = new Logger();
