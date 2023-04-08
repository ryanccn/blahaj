import { ChannelType, EmbedBuilder, type Message } from 'discord.js';
import { red } from 'kleur/colors';

export const logDM = async (message: Message<boolean>) => {
  if (!process.env.DM_LOGS_CHANNEL) return;

  const logsChannel = await message.client.channels.fetch(
    process.env.DM_LOGS_CHANNEL
  );
  if (!logsChannel || logsChannel.type !== ChannelType.GuildText) {
    console.error(
      red(
        `Specified DM logging channel ${process.env.DM_LOGS_CHANNEL} does not exist or is not a text channel!`
      )
    );
    return;
  }

  const dmEmbed = new EmbedBuilder()
    .setDescription(message.content || '*No content*')
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp(message.createdTimestamp);

  if (message.attachments.size > 0) {
    dmEmbed.addFields({
      name: 'Attachments',
      value: [...message.attachments.mapValues((k) => k.url).values()].join(
        '\n'
      ),
    });
  }

  await logsChannel.send({
    embeds: [dmEmbed],
  });
};
