import { ActivityType } from 'discord.js';
import { successEmbed } from '~/utils';

import type { Command } from './_types';

export const presenceCommand: Command = async (i) => {
  await i.deferReply({ ephemeral: true });

  const text = i.options.getString('content', true);
  const type = i.options.getString('type');

  const parsedType =
    type === 'Playing'
      ? ActivityType.Playing
      : type === 'Streaming'
      ? ActivityType.Streaming
      : type === 'Listening'
      ? ActivityType.Listening
      : type === 'Watching'
      ? ActivityType.Watching
      : type === 'Competing'
      ? ActivityType.Competing
      : ActivityType.Playing;

  i.client.user!.setPresence({
    activities: [{ type: parsedType, name: text }],
  });

  await i.editReply({
    embeds: [
      successEmbed('Presence updated!', `${type ?? 'Playing'} **${text}**`),
    ],
  });
};
