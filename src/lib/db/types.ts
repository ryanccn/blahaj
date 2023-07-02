import { Selectable, Insertable, Updateable, ColumnType } from "kysely";

export interface Database {
	guild_config: GuildConfigTable;
}

export interface GuildConfigTable {
	guild: string;
	features_randomuwu: boolean;
	features_starboard: boolean;
	features_github_expansion: boolean;
	temporary_category: string | null;
	fren_category: string | null;
	fren_role_id: string | null;
	fren_starboard_channel: string | null;
	starboard_channel: string | null;
	starboard_emojis: ColumnType<string[], string, string>;
	starboard_threshold: number;
	chatbot_token: string | null;
	chatbot_channel: string | null;
	chatbot_escape_character: string;
}

export type GuildConfig = Selectable<GuildConfigTable>;
export type NewGuildConfig = Insertable<GuildConfigTable>;
export type GuildConfigUpdate = Updateable<GuildConfigTable>;
