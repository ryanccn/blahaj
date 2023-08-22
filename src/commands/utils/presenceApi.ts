import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { get } from "~/lib/db";
import type { SlashCommand } from "../_types";

export const presenceApiCommand: SlashCommand = async (i) => {
	await i.deferReply({ ephemeral: true });

	const existingToken = await get(["presenceapi-token", i.user.id]);

	if (typeof existingToken === "string") {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setLabel("Cancel")
				.setCustomId(`presenceapi-cancel`),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel("Proceed")
				.setCustomId(`presenceapi-reset`),
		);

		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Resetting API key")
					.setDescription(
						"This will reset your API key and break any of your applications that are currently using the Blåhaj presence API until their tokens are updated.",
					)
					.setColor(0xfacc15),
			],
			components: [row],
		});
	} else {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setLabel("Cancel")
				.setCustomId(`presenceapi-cancel`),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel("Proceed")
				.setCustomId(`presenceapi-create`),
		);

		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Generating API key")
					.setDescription(
						"This will generate a new API key for accessing your presence via the Blåhaj presence API.",
					)
					.setColor(0x34d399),
			],
			components: [row],
		});
	}
};
