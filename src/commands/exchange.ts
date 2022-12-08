import { EmbedBuilder } from 'discord.js';

import { exchange } from '~/db';

import type { Command } from './_types';

export const exchangeCommand: Command = async (i) => {
  await i.deferReply();

  const value = i.options.getNumber('value', true);

  const info = await exchange(i.user.id, value);

  if (!info) {
    await i.editReply({
      embeds: [
        {
          title: 'An error occurred!',
          description: 'The purchase failed.',
          color: 0xfa5252,
        },
      ],
    });

    return;
  }

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${i.user.tag} bought ${value} HAJ!`)
        .setDescription(`Equivalent to **${value * 100} XP**`)
        .setThumbnail(i.client.user.avatarURL())
        .setColor(0x38d9a9),
    ],
  });
};
