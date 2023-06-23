import { uwurandom } from "~/lib/uwurandom";
import type { SlashCommand } from "../_types";

export const uwurandomCommand: SlashCommand = async (i) => {
	const length = i.options.getInteger("length", true);

	await i.reply({
		content: uwurandom(length),
		allowedMentions: { parse: [] },
	});
};
