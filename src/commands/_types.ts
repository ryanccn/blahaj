import type { CacheType, ChatInputCommandInteraction } from 'discord.js';

export type Command = (
  i: ChatInputCommandInteraction<CacheType>
) => void | Promise<void>;
