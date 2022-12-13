import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from './_types';

export const selfBanCommand: Command = async (i) => {
  await i.deferReply({ ephemeral: true });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('self-ban-confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('self-ban-cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  await i.editReply({
    content:
      'Are you **absolutely sure** you want to ban yourself? **This action is permanent!**',
    components: [row],
  });
};
