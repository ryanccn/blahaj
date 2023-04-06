import type { SlashCommand } from './_types';

export const pingCommand: SlashCommand = async (i) => {
  await i.reply({
    content: `Pong! \`${i.client.ws.ping}ms\``,
    ephemeral: true,
  });
};
