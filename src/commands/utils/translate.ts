import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import type { ContextMenuCommand } from "../_types";

import { v2 } from "@google-cloud/translate";
import { config } from "~/env";

const client = new v2.Translate({
	projectId: config.GOOGLE_CLOUD_PROJECT_ID,
	credentials: {
		client_email: config.GOOGLE_CLOUD_CLIENT_EMAIL,
		private_key: config.GOOGLE_CLOUD_PRIVATE_KEY,
	},
});

export const translateCommand: ContextMenuCommand = async (i) => {
	if (!i.isMessageContextMenuCommand()) return;
	if (!config.GOOGLE_CLOUD_PROJECT_ID || !config.GOOGLE_CLOUD_CLIENT_EMAIL || !config.GOOGLE_CLOUD_PRIVATE_KEY) {
		await i.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Translation unavailable!")
					.setDescription("Google Cloud Translation API is not configured properly.")
					.setColor(0xfacc15),
			],
		});
		return;
	}

	if (i.targetMessage.content.length === 0) {
		await i.reply({
			ephemeral: true,
			embeds: [
				new EmbedBuilder()
					.setTitle("Translation unavailable!")
					.setDescription("There is nothing to be translated.")
					.setColor(0xfacc15),
			],
		});
		return;
	}

	await i.deferReply({ ephemeral: false });

	const message = i.targetMessage;

	const [response, { data }] = await client.translate(message.content, {
		to: "en",
	});

	await i.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle("Translation")
				.setDescription(response)
				.setColor(0x34d399)
				.setFooter({
					text: `${data.translations[0].detectedSourceLanguage} → en`,
				}),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Original message").setURL(message.url),
			),
		],
	});
};
