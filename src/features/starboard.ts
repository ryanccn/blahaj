import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  type GuildBasedChannel,
  type MessageReaction,
} from 'discord.js';

import { get, set, del } from '~/lib/db';

let EMOJI_REACTION_THRESHOLD = 2;
if (process.env.STARBOARD_THRESHOLD) {
  EMOJI_REACTION_THRESHOLD = parseInt(process.env.STARBOARD_THRESHOLD);
}

let STARBOARD_EMOJIS = ['⭐'];
if (process.env.STARBOARD_EMOJIS) {
  STARBOARD_EMOJIS = process.env.STARBOARD_EMOJIS.split(',');
}

const getStarboardChannel = async (e: MessageReaction) => {
  if (
    e.message.channel.type !== ChannelType.GuildText &&
    e.message.channel.type !== ChannelType.PublicThread
  )
    return null;

  if (
    e.message.channel.parent &&
    e.message.channel.parent.id === process.env.FREN_CATEGORY_ID &&
    process.env.FREN_STARBOARD_CHANNEL
  ) {
    let starboard: GuildBasedChannel | null | undefined =
      e.message.guild!.channels.cache.get(process.env.FREN_STARBOARD_CHANNEL);

    if (!starboard) {
      starboard = await e.message.guild!.channels.fetch(
        process.env.FREN_STARBOARD_CHANNEL
      );
    }

    if (!starboard || starboard.type !== ChannelType.GuildText) {
      throw new Error(
        `Configured FREN_STARBOARD_CHANNEL (${process.env.FREN_STARBOARD_CHANNEL}) is invalid!`
      );
    }

    return starboard;
  }

  if (
    e.message
      .guild!.roles.everyone.permissionsIn(e.message.channelId)
      .has(PermissionFlagsBits.ViewChannel) &&
    process.env.STARBOARD_CHANNEL
  ) {
    let starboard: GuildBasedChannel | null | undefined =
      e.message.guild!.channels.cache.get(process.env.STARBOARD_CHANNEL);

    if (!starboard) {
      starboard = await e.message.guild!.channels.fetch(
        process.env.STARBOARD_CHANNEL
      );
    }

    if (!starboard || starboard.type !== ChannelType.GuildText) {
      throw new Error(
        `Configured STARBOARD_CHANNEL (${process.env.STARBOARD_CHANNEL}) is invalid!`
      );
    }

    return starboard;
  }

  return null;
};

export const handleStarAdd = async (e: MessageReaction) => {
  const emojiIdentifier = e.emoji.id ?? e.emoji.name;

  if (!emojiIdentifier || !STARBOARD_EMOJIS.includes(emojiIdentifier)) return;
  if (e.count < EMOJI_REACTION_THRESHOLD) return;

  if (e.message.partial) e.message = await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const starboard = await getStarboardChannel(e);

  if (!starboard) return;

  const existingMessageId = await get([
    'starboard',
    e.message.id,
    emojiIdentifier,
    'message',
  ]);
  if (existingMessageId) {
    const existingResolvedMessage = await starboard.messages
      .fetch()
      .then((res) => res.find((k) => k.id === existingMessageId));

    if (!existingResolvedMessage) {
      await del(['starboard', e.message.id, emojiIdentifier, 'message']);
    } else {
      await existingResolvedMessage.edit(
        `**${e.emoji} ${e.count}** in <#${e.message.channel.id}>`
      );
      return;
    }
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Jump to message')
      .setURL(e.message.url)
      .setStyle(ButtonStyle.Link)
  );

  const msg = await starboard.send({
    content: `**${e.emoji} ${e.count}** in <#${e.message.channel.id}>`,
    embeds: [
      {
        description: e.message.content ?? '*No content*',
        author: {
          name: e.message.author.bot
            ? e.message.author.username
            : e.message.author.tag,
          icon_url: e.message.author.avatarURL() ?? undefined,
        },
      },
    ],
    components: [row],
  });

  const MONTH = 30 * 24 * 60 * 60;
  await set(
    ['starboard', e.message.id, emojiIdentifier, 'message'],
    msg.id,
    MONTH
  );
};

export const handleStarRemove = async (e: MessageReaction) => {
  const emojiIdentifier = e.emoji.id ?? e.emoji.name;
  if (!emojiIdentifier || !STARBOARD_EMOJIS.includes(emojiIdentifier)) return;

  if (!process.env.STARBOARD_CHANNEL) {
    console.warn('STARBOARD_CHANNEL not configured!');
    return;
  }

  if (e.message.partial) e.message = await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const starboard = await getStarboardChannel(e);
  if (!starboard) return;

  const existingMessageId = await get([
    'starboard',
    e.message.id,
    emojiIdentifier,
    'message',
  ]);

  if (!existingMessageId)
    throw new Error(`Starboard data for ${e.message.id} could not be found!`);

  const existingResolvedMessage = await starboard.messages
    .fetch({ around: existingMessageId, limit: 3 })
    .then((res) => res.find((k) => k.id === existingMessageId));

  if (!existingResolvedMessage) return;

  if (e.count < EMOJI_REACTION_THRESHOLD) {
    await existingResolvedMessage.delete();
  } else {
    await existingResolvedMessage.edit(
      `**${e.emoji} ${e.count}** in <#${e.message.channel.id}>`
    );
  }
};
