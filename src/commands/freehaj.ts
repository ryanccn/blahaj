import { EmbedBuilder } from 'discord.js';
import { freehaj, getInfo } from '~/db';
import type { Command } from './_types';

export const freehajCommand: Command = async (i) => {
  await i.deferReply();

  const info = await freehaj(i.user.id);

  if (info !== true) {
    await i.editReply({
      embeds: [
        {
          title: '<:blobfoxoutage:1036216579354005506> Cooldown!',
          description: `You can get more free hajs <t:${info}:R>.`,
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
        .setTitle(`Collected some free hajs!`)
        .setDescription(
          `You collected **100 hajs**.\n\nNew balance: **${
            newUserInfo!.hajs
          } HAJ**`
        )
        .setColor(0x51cf66),
    ],
  });
};
