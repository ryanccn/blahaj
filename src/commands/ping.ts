import type { Command } from './_types';

export const pingCommand: Command = async (i) => {
  await i.reply({
    content: `Pong! \`${i.client.ws.ping}ms\``,
    ephemeral: true,
  });
};
