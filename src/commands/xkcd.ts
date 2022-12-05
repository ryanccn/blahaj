import type { Command } from './_types';

export const xkcdCommand: Command = async (i) => {
  if (!i.channel || !i.channel.isTextBased()) return;

  await i.deferReply();

  const id = i.options.getInteger('id', true);

  const data = await fetch(
    `https://xkcd.com/${encodeURIComponent(id)}/info.0.json`
  );
  if (!data.ok) {
    await i.editReply({
      embeds: [
        {
          title: '404 Not Found!',
          description: 'The ID you provided is invalid D:',
          color: 0xfa5252,
        },
      ],
    });

    setTimeout(() => {
      i.deleteReply();
    }, 5000);

    return;
  }

  await i.editReply(`https://xkcd.com/${encodeURIComponent(id)}/`);
};
