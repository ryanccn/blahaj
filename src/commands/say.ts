import type { Command } from './_types';

export const sayCommand: Command = async (i) => {
  if (!i.channel || !i.channel.isTextBased()) return;

  await i.deferReply({ ephemeral: true });

  const text = i.options.getString('content', true);
  await i.channel.send(text);

  await i.editReply('Message sent!');
};
