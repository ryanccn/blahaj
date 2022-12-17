import { EmbedBuilder, type Guild } from 'discord.js';

export const getHajEmoji = async (guild: Guild) => {
  const emojis = await guild.emojis.fetch();
  const haj = emojis.find((k) => k.name === 'haj');
  return haj ? `<:haj:${haj.id}>` : '[haj]';
};

export const successEmbed = (title: string, description: string) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x51cf66);
};
