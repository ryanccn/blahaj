import type { SlashCommand } from './_types';

import { Uwurandom } from 'uwurandom-node';

export const uwurandomCommand: SlashCommand = async (i) => {
  const length = i.options.getInteger('length', true);

  const uwurandom = Uwurandom.new();
  let result = '';

  for (let i = 0; i < length; i++) {
    result += uwurandom.generate();
  }

  await i.reply({
    content: result,
  });
};
