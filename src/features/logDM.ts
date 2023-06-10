import { ChannelType, type Message } from "discord.js";
import { messageEmbed } from "~/lib/messageEmbed";

export const logDM = async (message: Message<boolean>) => {
	if (!process.env.DM_LOGS_CHANNEL) return;

	const logsChannel = await message.client.channels.fetch(process.env.DM_LOGS_CHANNEL);
	if (!logsChannel || logsChannel.type !== ChannelType.GuildText) {
		throw new Error(
			`Specified DM logging channel ${process.env.DM_LOGS_CHANNEL} does not exist or is not a text channel!`
		);
	}

	await logsChannel.send({
		embeds: [await messageEmbed(message)],
	});
};
