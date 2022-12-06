import { EmbedBuilder } from 'discord.js';

import { getInfo } from '~/db';
import { getHajEmoji } from '~/utils';

import type { Command } from './_types';

const levelsFromXp = (xp: number) => {
  return Math.floor(5 * Math.log10(xp / 10));
};

export const infoCommand: Command = async (i) => {
  await i.deferReply();

  const member = i.options.getUser('user') ?? i.user;

  const info = await getInfo(member.id);
  if (!info) {
    await i.editReply({
      embeds: [
        {
          title: '404 Not Found!',
          description: 'The member you provided is not part of the server',
          color: 0xfa5252,
        },
      ],
    });

    setTimeout(() => {
      i.deleteReply();
    }, 5000);

    return;
  }

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(member.tag)
        .setFields([
          {
            name: '✨ XP',
            value: `**Level ${levelsFromXp(info.xp)}** (${info.xp} points)`,
          },
          {
            name: `${await getHajEmoji(i.guild!)} Hajs`,
            value: `**${info.hajs}** HAJ`,
            inline: true,
          },
        ])
        .setThumbnail(member.avatarURL())
        .setColor(0x38d9a9),
    ],
  });
};
