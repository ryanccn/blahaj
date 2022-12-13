import type { ButtonInteraction } from 'discord.js';

export const handleButton = async (i: ButtonInteraction) => {
  // await i.deferUpdate();

  if (i.customId === 'self-ban-confirm') {
    await i.guild!.bans.create(i.user, {
      reason: 'Self-requested via /self-timeout',
    });

    await i.update({ content: 'Banned!', components: [] });
  } else if (i.customId === 'self-ban-cancel') {
    await i.update({ content: 'Cancelled!', components: [] });
  }
};
