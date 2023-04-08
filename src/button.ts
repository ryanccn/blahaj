import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
} from 'discord.js';

export const handleButton = async (i: ButtonInteraction) => {
  const buttonId = i.customId;

  if (buttonId.startsWith('fren-accept::')) {
    const [, userId, date] = buttonId.split('::');

    if (Date.now() - parseInt(date) > 7 * 24 * 60 * 60 * 1000) {
      await i.channel!.send(
        'The invite has expired! Please ask for a new one :>'
      );
      await i.channel?.delete();
      return;
    }

    if (!process.env.FREN_ROLE_ID) {
      throw new Error('No FREN_ROLE_ID configured!');
    }

    const guild = await i.client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(userId);

    await member.roles.add(process.env.FREN_ROLE_ID);

    await i.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel('Accept')
            .setCustomId(`fren-disabled-accept`)
            .setDisabled(true)
        ),
      ],
    });
    await i.channel!.send('You have been added to `@fren`. Have fun!');
    setTimeout(async () => {
      await i.channel?.delete();
    }, 5000); // so the person can see the message before
  }
};
