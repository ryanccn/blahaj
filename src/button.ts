import type { ButtonInteraction } from 'discord.js';

export const handleButton = async (i: ButtonInteraction) => {
  const buttonId = i.customId;

  if (buttonId.startsWith('fren-accept::')) {
    await i.deferReply();
    const [, userId, date] = buttonId.split('::');

    if (Date.now() - parseInt(date) > 7 * 24 * 60 * 60 * 1000) {
      await i.editReply('The invite has expired! Please ask for a new one :>');
      return;
    }

    if (!process.env.FREN_ROLE_ID) {
      throw new Error('No FREN_ROLE_ID configured!');
    }

    const guild = await i.client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(userId);

    await member.roles.add(process.env.FREN_ROLE_ID);
    await i.editReply('You have been added to `@fren`. Have fun!');
  }
};
