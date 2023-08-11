import { type Channel, ChannelType } from "discord.js";
import { config } from "~/env";

export const handleThreadCreate = async (channel: Channel) => {
	if (channel.type !== ChannelType.PublicThread) return;
	if (!config.THREAD_CREATE_MESSAGE) return;

	const placeholder = await channel.send("bleh");
	await placeholder.edit(config.THREAD_CREATE_MESSAGE);

	await placeholder.delete();
};
