import { EmbedBuilder } from 'discord.js';

import { flip, getInfo } from '~/db';

import type { Command } from './_types';

export const flipCommand: Command = async (i) => {
  await i.deferReply();

  const value = i.options.getNumber('bet', true);

  const info = await flip(i.user.id, value);

  if (info === 'error') {
    await i.editReply({
      embeds: [
        {
          title: 'An error occurred!',
          description: 'The flip failed.',
          color: 0xfa5252,
        },
      ],
    });

    return;
  }

  const newUserInfo = await getInfo(i.user.id);

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`You ${info === 'win' ? 'won' : 'lost'}!`)
        .setDescription(
          `${
            info === 'win'
              ? '<:blobfoxfloof:1036217137959800853>'
              : '<:blobfoxsad:1036216586207506483>'
          }You ${
            info === 'win' ? 'won' : 'lost'
          } **${value} hajs**.\n\nNew balance: **${newUserInfo!.hajs} HAJ**`
        )
        .setColor(info === 'win' ? 0x51cf66 : 0xfa5252),
    ],
  });
};
