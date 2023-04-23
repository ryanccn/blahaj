import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type MessageReaction,
} from 'discord.js';

import { getGuildEmoji } from '~/lib/utils';
import { decr, del, get, incr, set } from '~/lib/db';

let EMOJI_REACTION_THRESHOLD = 2;
if (process.env.CATSTAREBOARD_THRESHOLD) {
  EMOJI_REACTION_THRESHOLD = parseInt(process.env.CATSTAREBOARD_THRESHOLD);
}

export const handleCatstareAdd = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;
  if (e.count < EMOJI_REACTION_THRESHOLD) return;

  if (!process.env.CATSTAREBOARD_CHANNEL)
    throw new Error('CATSTAREBOARD_CHANNEL not configured!');

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const catstareBoard = await e.message.guild.channels.fetch(
    process.env.CATSTAREBOARD_CHANNEL
  );

  if (!catstareBoard || catstareBoard.type !== ChannelType.GuildText) {
    throw new Error(
      `Configured CATSTAREBOARD_CHANNEL (${process.env.CATSTAREBOARD_CHANNEL}) is invalid!`
    );
  }

  const existingMessageId = await get([
    'catstareboard',
    e.message.id,
    'message',
  ]);
  if (existingMessageId) {
    const existingResolvedMessage = await catstareBoard.messages
      .fetch()
      .then((res) => res.find((k) => k.id === existingMessageId));

    if (!existingResolvedMessage) {
      await Promise.all([
        del(['catstareboard', e.message.id, 'message']),
        del(['catstareboard', e.message.id, 'count']),
      ]);
    } else {
      const newCount = await incr(['catstareboard', e.message.id, 'count']);

      await existingResolvedMessage.edit(
        `**${await getGuildEmoji(
          e.message.guild,
          'catstare'
        )} ${newCount}** in <#${e.message.channel.id}>`
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

  const msg = await catstareBoard.send({
    content: `**${await getGuildEmoji(e.message.guild, 'catstare')} ${
      e.count
    }** in <#${e.message.channel.id}>`,
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

  await Promise.all([
    set(['catstareboard', e.message.id, 'count'], 1),
    set(['catstareboard', e.message.id, 'message'], msg.id),
  ]);
};

export const handleCatstareRemove = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;

  if (!process.env.CATSTAREBOARD_CHANNEL)
    throw new Error('CATSTAREBOARD_CHANNEL not configured!');

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const catstareBoard = await e.message.guild.channels.fetch(
    process.env.CATSTAREBOARD_CHANNEL
  );

  if (!catstareBoard || catstareBoard.type !== ChannelType.GuildText) {
    throw new Error(
      `Configured CATSTAREBOARD_CHANNEL (${process.env.CATSTAREBOARD_CHANNEL}) is invalid!`
    );
  }

  const existingMessageId = await get([
    'catstareboard',
    e.message.id,
    'message',
  ]);

  if (!existingMessageId)
    throw new Error(
      `Catstareboard data for ${e.message.id} could not be found!`
    );

  const existingResolvedMessage = await catstareBoard.messages
    .fetch({ around: existingMessageId })
    .then((res) => res.find((k) => k.id === existingMessageId));

  if (!existingResolvedMessage) {
    return;
  }

  const newCount = await decr(['catstareboard', e.message.id, 'count']);
  if (newCount < EMOJI_REACTION_THRESHOLD) {
    await existingResolvedMessage.delete();
  } else {
    await existingResolvedMessage.edit(
      `**${await getGuildEmoji(
        e.message.guild,
        'catstare'
      )} ${newCount}** in <#${e.message.channel.id}>`
    );
  }
};
