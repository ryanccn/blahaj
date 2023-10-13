import type { ChatInputCommandInteraction, Interaction, MessageContextMenuCommandInteraction } from "discord.js";

export type GenericCommand<T extends Interaction> = (i: T) => void | Promise<void>;

export type SlashCommand = GenericCommand<ChatInputCommandInteraction>;
export type ContextMenuCommand = GenericCommand<MessageContextMenuCommandInteraction>;
