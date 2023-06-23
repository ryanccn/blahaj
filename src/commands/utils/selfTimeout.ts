import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import parseDuration from "parse-duration";
import type { SlashCommand } from "../_types";

export const selfTimeoutCommand: SlashCommand = async (i) => {
	await i.deferReply({ ephemeral: true });

	const durationString = i.options.getString("duration", true);
	const duration = parseDuration(durationString);

	if (!duration) {
		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Self-timeout error")
					.setDescription("Invalid duration provided!")
					.setColor(0xef4444),
			],
		});

		return;
	}

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Secondary)
			.setLabel("Cancel")
			.setCustomId(`self-timeout-cancel::${i.user.id}::${duration}`),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Danger)
			.setLabel("Proceed")
			.setCustomId(`self-timeout-proceed::${i.user.id}::${duration}`)
	);

	await i.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle("Self-timeout")
				.setDescription(
					`This command will time you out in this server for \`${durationString}\`. **Think carefully before you proceed with this action!** Moderators will not process requests to undo self-timeouts.`
				)
				.setColor(0xfacc15),
		],
		components: [row],
	});
};
