import { EmbedBuilder, type Message, type Guild } from 'discord.js';
import { blue, bold, red, dim } from 'kleur/colors';
import { type ZodError } from 'zod';

const PLURALKIT_USER_ID = '466378653216014359';
export const isPluralKit = async (message: Message) => {
  try {
    const webhook = await message.fetchWebhook();
    return webhook.owner?.id === PLURALKIT_USER_ID;
  } catch {
    return false;
  }
};

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

export const formatZodError = (err: ZodError) => {
  const issues = err.issues;
  let ret = red(
    bold(`${issues.length} validation error${issues.length > 1 ? 's' : ''}!\n`)
  );

  for (const issue of issues) {
    ret += `${blue(issue.path.join(' > '))} ${dim('::')} ${issue.message}\n`;
  }

  return ret;
};
