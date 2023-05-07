import { EmbedBuilder, type Message } from 'discord.js';

export const messageEmbed = async (message: Message) => {
  const embed = new EmbedBuilder()
    .setDescription(message.content || '*No content*')
    .setAuthor({
      name: message.member?.nickname ?? message.author.username,
      iconURL:
        message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined,
    })
    .setTimestamp(message.createdTimestamp);

  if (message.attachments.size > 0) {
    embed.addFields({
      name: 'Attachments',
      value: message.attachments.map((att) => att.url).join('\n'),
    });
  }

  if (message.reference) {
    const repliedToMessage = await message.fetchReference();

    embed.addFields({
      name: 'Replying to',
      value: repliedToMessage.url,
    });
  }

  return embed;
};
