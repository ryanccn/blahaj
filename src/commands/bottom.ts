import { encode, decode } from 'bottomify';
import { Command } from './_types';

export const bottomCommand: Command = async (i) => {
  const subcmd = i.options.getSubcommand();
  const msg = i.options.getString('content', true);
  await i.reply({
    content: subcmd === 'encode' ? encode(msg) : decode(msg),
  });
};
