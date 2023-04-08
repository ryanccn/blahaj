import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import { nanoid } from 'nanoid';

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

  if (!i.guild) return;

  if (!process.env.TEMPORARY_CATEGORY_ID) {
    await i.editReply({
      content: '`TEMPORARY_CATEGORY_ID` not configured properly!',
    });
    return;
  }
  const temporaryCategory = await i.guild.channels.fetch(
    process.env.TEMPORARY_CATEGORY_ID
  );
  if (!temporaryCategory) {
    await i.editReply({
      content: `Could not find category with ID \`${process.env.TEMPORARY_CATEGORY_ID}\``,
    });
    return;
  }
  if (!(temporaryCategory instanceof CategoryChannel)) {
    await i.editReply({
      content: `<#${temporaryCategory.id}> is not a category channel!`,
    });
    return;
  }

  const channel = await i.guild.channels.create({
    name: 'fren-invitation-' + nanoid(8),
    parent: temporaryCategory,
    permissionOverwrites: [
      {
        id: i.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages],
      },
      {
        id: i.client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  if (!channel) {
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
