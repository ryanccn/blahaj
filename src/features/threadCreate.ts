import { type Channel, ChannelType } from "discord.js";

export const handleThreadCreate = async (channel: Channel) => {
	if (channel.type !== ChannelType.PublicThread) return;
	if (!process.env.THREAD_CREATE_MESSAGE) return;

	const placeholder = await channel.send("bleh");
	await placeholder.edit(process.env.THREAD_CREATE_MESSAGE);

	await placeholder.delete();
};
