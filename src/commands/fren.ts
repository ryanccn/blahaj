import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  PermissionsBitField,
} from 'discord.js';
import type { SlashCommand } from './_types';

const frenAddMessage = (id: string) =>
  `
Hello there <@${id}>!

Ryan, the owner of Ryanland, has invited you to **the private friends category** of the server! You will get the \`@fren\` role and gain access to a few new private channels.

You received this invitation because Ryan has deemed you to be a fun and nice person in general.

This invite expires in 7 days. You are free to accept or ignore this invitation, no pressure :p
`.trim();

export const frenAdd: SlashCommand = async (i) => {
  await i.deferReply({ ephemeral: true });
  const user = i.options.getUser('user', true);
  const channel = await i.guild?.channels.create({
    name: 'fren-invitation-' + user.username,
    parent: process.env.FREN_CATEGORY_ID
      ? ((await i.guild.channels.fetch(
          process.env.FREN_CATEGORY_ID
        )) as CategoryChannel)
      : null,
    permissionOverwrites: [
      {
        id: i.guild.roles.everyone.id,
        deny: PermissionsBitField.All,
      },
      {
        id: user.id,
        allow: PermissionsBitField.Default,
      },
    ],
  });

  if (channel == undefined) {
    await i.editReply({
      content: 'Failed to create a channel!',
    });
    return;
  }

  await channel.send({
    content: frenAddMessage(user.id),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel('Accept')
          .setCustomId(`fren-accept::${user.id}::${Date.now()}`)
      ),
    ],
  });

  await i.editReply({
    content: `Fren request sent to <@${user.id}>!`,
    allowedMentions: { parse: [] },
  });
};
