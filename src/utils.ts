import { EmbedBuilder, type Guild } from 'discord.js';

export const getGuildEmoji = async (guild: Guild, name: string) => {
  const emojis = await guild.emojis.fetch();
  const foundEmoji = emojis.find((k) => k.name === name);
  return foundEmoji ? `<:${name}:${foundEmoji.id}>` : `[${name}]`;
};

export const successEmbed = (title: string, description: string) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x51cf66);
};
