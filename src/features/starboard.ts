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
import { get, set, del } from "~/lib/db";

let EMOJI_REACTION_THRESHOLD = 3;
if (process.env.STARBOARD_THRESHOLD) {
	EMOJI_REACTION_THRESHOLD = Number.parseInt(process.env.STARBOARD_THRESHOLD);
}

let STARBOARD_EMOJIS = ["⭐"];
if (process.env.STARBOARD_EMOJIS) {
	STARBOARD_EMOJIS = process.env.STARBOARD_EMOJIS.split(",");
}

const getStarboardChannel = async (message: Message) => {
	if (message.channel.type !== ChannelType.GuildText && message.channel.type !== ChannelType.PublicThread) return null;
	if (!message.guild) return null;

	if (
		message.channel.parent &&
		(message.channel.parent.id === process.env.FREN_CATEGORY_ID ||
			(message.channel.parent.parent && message.channel.parent.parent.id === process.env.FREN_CATEGORY_ID)) &&
		process.env.FREN_STARBOARD_CHANNEL
	) {
		let starboard: GuildBasedChannel | null | undefined = message.guild!.channels.cache.get(
			process.env.FREN_STARBOARD_CHANNEL
		);

		if (!starboard) {
			starboard = await message.guild!.channels.fetch(process.env.FREN_STARBOARD_CHANNEL);
		}

		if (!starboard || starboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured FREN_STARBOARD_CHANNEL (${process.env.FREN_STARBOARD_CHANNEL}) is invalid!`);
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
		process.env.STARBOARD_CHANNEL
	) {
		let starboard: GuildBasedChannel | null | undefined = message.guild!.channels.cache.get(
			process.env.STARBOARD_CHANNEL
		);

		if (!starboard) {
			starboard = await message.guild!.channels.fetch(process.env.STARBOARD_CHANNEL);
		}

		if (!starboard || starboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured STARBOARD_CHANNEL (${process.env.STARBOARD_CHANNEL}) is invalid!`);
		}

		return starboard;
	}

	return null;
};

const updateStarboard = async (message: Message) => {
	const starboard = await getStarboardChannel(message);
	if (!starboard) return;

	const reactions = message.reactions.cache.filter(
		(reaction) =>
			STARBOARD_EMOJIS.includes(reaction.emoji.id ?? reaction.emoji.name ?? "") &&
			reaction.count >= EMOJI_REACTION_THRESHOLD
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
