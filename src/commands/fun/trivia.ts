import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { startTrivia, stopTrivia } from "~/features/trivia";
import { getTriviaNames } from "~/features/trivia/data";

import type { SlashCommand } from "../_types";

export const triviaStartCommand: SlashCommand = async (i) => {
	const name = i.options.getString("name", true);

	const triviaKeys = await getTriviaNames();

	if (!triviaKeys.includes(name)) {
		await i.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("This trivia does not exist!").setDescription(
						`Available trivia sets:\n${triviaKeys.map(k => `- \`${k}\``).join("\n")}`,
					),
			],
			ephemeral: true,
		});
		return;
	}

	if (i.channel && i.channel.type === ChannelType.GuildText) {
		await startTrivia(name, i.channel);
	}

	await i.reply({
		content: `Started trivia: **${name}**!`,
		ephemeral: true,
	});
};

export const triviaStopCommand: SlashCommand = async (i) => {
	if (i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
		if (i.channel && i.channel.type === ChannelType.GuildText) {
			await stopTrivia(i.channel);
		}

		await i.reply({
			content: "Stopped trivia!",
			ephemeral: true,
		});
	} else {
		await i.reply({
			content: "You do not have the permissions to use this command :(",
			ephemeral: true,
		});
	}
};
