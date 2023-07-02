import { db, getGuildConfig } from "~/lib/db";
import type { SlashCommand } from "../_types";

export const configCommand: SlashCommand = async (i) => {
	if (!i.guildId) return;

	const subcmd = i.options.getSubcommand();
	const key = i.options.getString("key", true) as "starboard_emojis" | "starboard_threshold";
	const value = i.options.getString("value", true);

	if (subcmd === "set") {
		await i.deferReply({ ephemeral: true });

		await getGuildConfig(i.guildId);

		await db
			.updateTable("guild_config")
			.where("guild", "=", i.guildId)
			.set({ [key]: value })
			.execute();

		await i.editReply(`\`${key}\` set to \`${value}\``);
	}
};
