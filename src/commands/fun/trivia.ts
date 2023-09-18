import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { initTrivia, nextTrivia, stopTrivia } from "~/features/trivia";
import { getTriviaNames } from "~/features/trivia/data";

import type { SlashCommand } from "../_types";

export const triviaStartCommand: SlashCommand = async (i) => {
	await i.deferReply({ ephemeral: true });
	const name = i.options.getString("name", true);

	const triviaKeys = await getTriviaNames();

	if (!triviaKeys.includes(name)) {
		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("This trivia does not exist!")
					.setDescription(`Available trivia sets:\n${triviaKeys.map(k => `- \`${k}\``).join("\n")}`)
					.setColor(0xef4444),
			],
		});
		return;
	}

	if (i.channel && i.channel.type === ChannelType.GuildText) {
		await initTrivia(name, i.channel);
		await i.editReply("Trivia started");
		await i.channel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle("Trivia started!")
					.setDescription(`Set: \`${name}\``)
					.setColor(0xc084fc),
			],
		});
		await nextTrivia(i.channel);
	} else {
		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("This channel is not available!")
					.setDescription(`Use a standard text channel.`)
					.setColor(0xef4444),
			],
		});
	}
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
