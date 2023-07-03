import { Selectable, Insertable, Updateable, ColumnType } from "kysely";

export interface Database {
	guild_config: GuildConfigTable;
}

type ColumnWithDefault<T> = ColumnType<T, T | undefined, T | undefined>;

export interface GuildConfigTable {
	guild: string;
	features_starboard: ColumnWithDefault<boolean>;
	features_github_expansion: ColumnWithDefault<boolean>;
	temporary_category: string | null;
	starboard_channel: string | null;
	starboard_emojis: ColumnType<string[], string | undefined, string | undefined>;
	starboard_threshold: ColumnWithDefault<number>;
	chatbot_token: string | null;
	chatbot_channel: string | null;
	chatbot_escape_character: ColumnWithDefault<string>;
}

export type GuildConfig = Selectable<GuildConfigTable>;
export type NewGuildConfig = Insertable<GuildConfigTable>;
export type GuildConfigUpdate = Updateable<GuildConfigTable>;
