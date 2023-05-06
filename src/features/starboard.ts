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
if (process.env.STARBOARD_THRESHOLD) {
  EMOJI_REACTION_THRESHOLD = parseInt(process.env.STARBOARD_THRESHOLD);
}

export const handleStarAdd = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;
  if (e.count < EMOJI_REACTION_THRESHOLD) return;

  if (!process.env.STARBOARD_CHANNEL)
    throw new Error('STARBOARD_CHANNEL not configured!');

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const starboard = await e.message.guild.channels.fetch(
    process.env.STARBOARD_CHANNEL
  );

  if (!starboard || starboard.type !== ChannelType.GuildText) {
    throw new Error(
      `Configured STARBOARD_CHANNEL (${process.env.STARBOARD_CHANNEL}) is invalid!`
    );
  }

  const existingMessageId = await get(['starboard', e.message.id, 'message']);
  if (existingMessageId) {
    const existingResolvedMessage = await starboard.messages
      .fetch()
      .then((res) => res.find((k) => k.id === existingMessageId));

    if (!existingResolvedMessage) {
      await Promise.all([
        del(['starboard', e.message.id, 'message']),
        del(['starboard', e.message.id, 'count']),
      ]);
    } else {
      const newCount = await incr(['starboard', e.message.id, 'count']);

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

  const msg = await starboard.send({
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
    set(['starboard', e.message.id, 'count'], 1),
    set(['starboard', e.message.id, 'message'], msg.id),
  ]);
};

export const handleStarRemove = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;

  if (!process.env.STARBOARD_CHANNEL)
    throw new Error('STARBOARD_CHANNEL not configured!');

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const starboard = await e.message.guild.channels.fetch(
    process.env.STARBOARD_CHANNEL
  );

  if (!starboard || starboard.type !== ChannelType.GuildText) {
    throw new Error(
      `Configured STARBOARD_CHANNEL (${process.env.STARBOARD_CHANNEL}) is invalid!`
    );
  }

  const existingMessageId = await get(['starboard', e.message.id, 'message']);

  if (!existingMessageId)
    throw new Error(`Starboard data for ${e.message.id} could not be found!`);

  const existingResolvedMessage = await starboard.messages
    .fetch({ around: existingMessageId })
    .then((res) => res.find((k) => k.id === existingMessageId));

  if (!existingResolvedMessage) {
    return;
  }

  const newCount = await decr(['starboard', e.message.id, 'count']);
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
