import { encode, decode } from 'bottomify';
import type { SlashCommand } from './_types';

export const bottomCommand: SlashCommand = async (i) => {
  const subcmd = i.options.getSubcommand();
  const msg = i.options.getString('content', true);

  try {
    await i.reply({
      content: subcmd === 'encode' ? encode(msg) : decode(msg),
      allowedMentions: { parse: [] },
    });
  } catch (error: unknown) {
    if (
      error instanceof TypeError &&
      error.message.includes('Invalid bottom text')
    ) {
      await i.reply({
        content: 'You did not provide a properly encoded bottom text!',
        ephemeral: true,
      });
      return;
    }

    throw error;
  }
};
