import { EmbedBuilder, type Guild } from "discord.js";
import { blue, bold, cyan, dim, red } from "kleur/colors";

import { type BaseIssue, type BaseSchema, type BaseSchemaAsync, type ValiError } from "valibot";

export const getGuildEmoji = (guild: Guild, nameOrId: string) => {
	const emojis = guild.emojis.cache;
	const foundEmoji = emojis.find((k) => k.id === nameOrId || k.name === nameOrId);
	return foundEmoji ? `<:${nameOrId}:${foundEmoji.id}>` : `:${nameOrId}:`;
};

export const successEmbed = (title: string, description: string) => {
	return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x51cf66);
};

export const formatValiError = <
	TSchema extends
		| BaseSchema<unknown, unknown, BaseIssue<unknown>>
		| BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(err: ValiError<TSchema>) => {
	const issues = err.issues;
	let ret = red(bold(`${issues.length} validation error${issues.length === 1 ? "" : "s"}!\n`));

	for (const issue of issues) {
		const issuePath = issue.path?.map((p) => (p.key as string | number | symbol).toString()).join(dim(" > "))
			?? "unknown path";

		ret += blue(issuePath) + "\n";
		ret += "  " + dim("Message  ") + cyan(issue.message) + "\n";
		ret += "  " + dim("Expected ") + issue.expected + "\n";
		ret += "  " + dim("Received ") + issue.received + "\n";
	}

	return ret.trim();
};

/** https://stackoverflow.com/a/14919494 */
export const formatSize = (bytes: number, si = false, dp = 1) => {
	const thresh = si ? 1000 : 1024;

	if (Math.abs(bytes) < thresh) {
		return bytes + " B";
	}

	const units = si
		? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		: ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
	let u = -1;
	const r = 10 ** dp;

	do {
		bytes /= thresh;
		++u;
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

	return bytes.toFixed(dp) + " " + units[u];
};
