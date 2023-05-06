import { EmbedBuilder, type Guild } from 'discord.js';
import { blue, bold, red, dim } from 'kleur/colors';

import { type ZodError } from 'zod';

export const getGuildEmoji = async (guild: Guild, nameOrId: string) => {
  const emojis = guild.emojis.cache;
  const foundEmoji = emojis.find(
    (k) => k.id === nameOrId || k.name === nameOrId
  );
  return foundEmoji ? `<:${nameOrId}:${foundEmoji.id}>` : `:${nameOrId}:`;
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

/** https://stackoverflow.com/a/14919494 */
export const formatSize = (bytes: number, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
};
