import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type MessageReaction,
} from 'discord.js';

import { getGuildEmoji } from '~/utils';
import { decr, del, get, incr, set } from '~/db';
import { yellow } from 'kleur/colors';

export const handleCatstareAdd = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;
  if (e.count < 1) return;

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const channels = await e.message.guild.channels.fetch();
  const catstareBoard = channels.find((ch) => ch?.name === 'catstareboard');

  if (!catstareBoard || catstareBoard.type !== ChannelType.GuildText) {
    console.warn(yellow('No #catstareboard found!'));
    return;
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
      await del(['catstareboard', e.message.id, 'message']);
      await del(['catstareboard', e.message.id, 'count']);
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

  await set(['catstareboard', e.message.id, 'count'], 1);
  await set(['catstareboard', e.message.id, 'message'], msg.id);
};

export const handleCatstareRemove = async (e: MessageReaction) => {
  if (!e.emoji.name?.includes('catstare')) return;

  await e.message.fetch();

  if (!e.message.author || !e.message.guild) return;

  const channels = await e.message.guild.channels.fetch();
  const catstareBoard = channels.find((ch) => ch?.name === 'catstareboard');

  if (!catstareBoard || catstareBoard.type !== ChannelType.GuildText) {
    console.warn(yellow('No #catstareboard found!'));
    return;
  }

  const existingMessageId = await get([
    'catstareboard',
    e.message.id,
    'message',
  ]);

  const existingResolvedMessage = await catstareBoard.messages
    .fetch()
    .then((res) => res.find((k) => k.id === existingMessageId));

  if (!existingResolvedMessage) {
    return;
  }

  const newCount = await decr(['catstareboard', e.message.id, 'count']);
  if (newCount < 1) await existingResolvedMessage.delete();
  else {
    await existingResolvedMessage.edit(
      `**${await getGuildEmoji(
        e.message.guild,
        'catstare'
      )} ${newCount}** in <#${e.message.channel.id}>`
    );
  }
};
