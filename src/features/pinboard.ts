import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	PermissionFlagsBits,
	AuditLogEvent,
	TextChannel,
	type GuildBasedChannel,
	type GuildTextBasedChannel,
	type GuildAuditLogsEntry,
	type Guild,
} from "discord.js";

import { messageEmbed } from "~/lib/messageEmbed";

const getPinboardChannel = async (channel: GuildTextBasedChannel) => {
	if (
		channel.parent &&
		(channel.parent.id === process.env.FREN_CATEGORY_ID ||
			(channel.parent.parent && channel.parent.parent.id === process.env.FREN_CATEGORY_ID)) &&
		process.env.FREN_PINBOARD_CHANNEL
	) {
		let pinboard: GuildBasedChannel | null | undefined = channel.guild.channels.cache.get(
			process.env.FREN_PINBOARD_CHANNEL
		);

		if (!pinboard) {
			pinboard = await channel.guild!.channels.fetch(process.env.FREN_PINBOARD_CHANNEL);
		}

		if (!pinboard || pinboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured FREN_PINBOARD_CHANNEL (${process.env.FREN_PINBOARD_CHANNEL}) is invalid!`);
		}

		return pinboard;
	}

	if (
		channel &&
		(channel.type === ChannelType.GuildText
			? channel.permissionsFor(channel.guild.id)?.has(PermissionFlagsBits.ViewChannel)
			: channel.type === ChannelType.PublicThread
			? channel.parent!.permissionsFor(channel.guild.id)?.has(PermissionFlagsBits.ViewChannel)
			: false) &&
		process.env.PINBOARD_CHANNEL
	) {
		let pinboard: GuildBasedChannel | null | undefined = channel.guild.channels.cache.get(process.env.PINBOARD_CHANNEL);

		if (!pinboard) {
			pinboard = await channel.guild!.channels.fetch(process.env.PINBOARD_CHANNEL);
		}

		if (!pinboard || pinboard.type !== ChannelType.GuildText) {
			throw new Error(`Configured PINBOARD_CHANNEL (${process.env.PINBOARD_CHANNEL}) is invalid!`);
		}

		return pinboard;
	}

	return null;
};

export const updatePinboard = async (entry: GuildAuditLogsEntry, guild: Guild) => {
	if (entry.action !== AuditLogEvent.MessagePin) return;
	if (!entry.extra || !("messageId" in entry.extra)) return;

	const {
		executor: actor,
		extra: { channel: rawChannel, messageId },
	} = entry;

	const resolvedChannel = rawChannel instanceof TextChannel ? rawChannel : await guild.channels.fetch(rawChannel.id);
	if (!resolvedChannel || resolvedChannel.type !== ChannelType.GuildText) return;

	const resolvedMessage = await resolvedChannel.messages.fetch(messageId);

	const pinboard = await getPinboardChannel(resolvedMessage.channel);
	if (!pinboard) return;

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setLabel("Jump to message").setURL(resolvedMessage.url).setStyle(ButtonStyle.Link)
	);

	const pinboardMessage = await pinboard.send({
		content: `📌 ${actor === null ? "*Unknown*" : actor} in ${resolvedMessage.channel}`,
		embeds: [await messageEmbed(resolvedMessage)],
		components: [row],
		allowedMentions: { repliedUser: false, users: [], roles: [] },
	});

	await resolvedMessage.unpin(`Added to pinboard: ${pinboardMessage.url}`);
};
