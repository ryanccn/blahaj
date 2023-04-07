import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

  const dm = await user.createDM();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setLabel('Accept')
      .setCustomId(`fren-accept::${user.id}::${Date.now()}`)
  );
  await dm.send({ content: frenAddMessage(user.id), components: [row] });

  await i.editReply({
    content: `Fren request sent to <@${user.id}>!`,
    allowedMentions: { parse: [] },
  });
};
