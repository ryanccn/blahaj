import type { CacheType, ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";

export type SlashCommand = (i: ChatInputCommandInteraction<CacheType>) => void | Promise<void>;

export type ContextMenuCommand = (i: ContextMenuCommandInteraction<CacheType>) => void | Promise<void>;
