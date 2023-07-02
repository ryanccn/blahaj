import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	PermissionFlagsBits,
	type GuildBasedChannel,
	type MessageReaction,
	type Message,
} from "discord.js";

import { messageEmbed } from "~/lib/messageEmbed";
import { get, set, del } from "~/lib/db/redis";
import { getGuildConfig } from "~/lib/db";

const getStarboardChannel = async (message: Message) => {
	if (message.channel.type !== ChannelType.GuildText && message.channel.type !== ChannelType.PublicThread) return null;
	if (!message.guild || !message.guildId) return null;

	const { starboard_channel, fren_starboard_channel, fren_category } = await getGuildConfig(message.guildId);

	if (
		message.channel.parent &&
		(message.channel.parent.id === fren_category ||
			(message.channel.parent.parent && message.channel.parent.parent.id === fren_category)) &&
		fren_starboard_channel
	) {
		let starboard: GuildBasedChannel | null | undefined = message.guild!.channels.cache.get(fren_starboard_channel);

		if (!starboard) {
			starboard = await message.guild!.channels.fetch(fren_starboard_channel);
		}

		if (!starboard || starboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured fren_starboard_channel (${fren_starboard_channel}) is invalid!`);
		}

		return starboard;
	}

	if (
		message.channel &&
		(message.channel.type === ChannelType.GuildText
			? message.channel.permissionsFor(message.guild.id)?.has(PermissionFlagsBits.ViewChannel)
			: message.channel.type === ChannelType.PublicThread
			? message.channel.parent!.permissionsFor(message.guild.id)?.has(PermissionFlagsBits.ViewChannel)
			: false) &&
		starboard_channel
	) {
		let starboard: GuildBasedChannel | null | undefined = message.guild!.channels.cache.get(starboard_channel);

		if (!starboard) {
			starboard = await message.guild!.channels.fetch(starboard_channel);
		}

		if (!starboard || starboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured starboard_channel (${starboard_channel}) is invalid!`);
		}

		return starboard;
	}

	return null;
};

const updateStarboard = async (message: Message) => {
	if (!message.guildId) return;
	const { starboard_emojis, starboard_threshold } = await getGuildConfig(message.guildId);

	const starboard = await getStarboardChannel(message);
	if (!starboard) return;

	const reactions = message.reactions.cache.filter(
		(reaction) =>
			starboard_emojis.includes(reaction.emoji.id ?? reaction.emoji.name ?? "") && reaction.count >= starboard_threshold
	);

	const reactionString = reactions.map((reaction) => `${reaction.emoji} ${reaction.count}`).join(" ");

	let existingMessageId = await get(["starboard", message.id, "message"]);

	if (existingMessageId) {
		if (typeof existingMessageId !== "string") {
			throw new TypeError(`Message ID found for ${message.id} is not a string!`);
		}
		existingMessageId = existingMessageId.slice(1);

		const existingResolvedMessage = await starboard.messages
			.fetch({ around: existingMessageId, limit: 3 })
			.then((res) => res.find((k) => k.id === existingMessageId));

		if (!existingResolvedMessage) {
			await del(["starboard", message.id, "message"]);
		} else if (reactions.size === 0) {
			await existingResolvedMessage.delete();
			return;
		} else {
			await existingResolvedMessage.edit(`**${reactionString}** in <#${message.channel.id}>`);
			return;
		}
	}

	if (reactions.size === 0) return;

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setLabel("Jump to message").setURL(message.url).setStyle(ButtonStyle.Link)
	);

	const msg = await starboard.send({
		content: `**${reactionString}** in <#${message.channel.id}>`,
		embeds: [await messageEmbed(message)],
		components: [row],
	});

	const MONTH = 30 * 24 * 60 * 60;
	await set(["starboard", message.id, "message"], `c${msg.id}`, MONTH);
};

export const handleStarAdd = async (e: MessageReaction) => {
	if (e.message.partial) e.message = await e.message.fetch();
	await updateStarboard(e.message);
};

export const handleStarRemove = async (e: MessageReaction) => {
	if (e.message.partial) e.message = await e.message.fetch();
	await updateStarboard(e.message);
};
