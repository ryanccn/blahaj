import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database, GuildConfig } from "./types";

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL,
});
const dialect = new PostgresDialect({ pool });

export const db = new Kysely<Database>({ dialect });

export const getGuildConfig = async (guildId: string): Promise<GuildConfig> => {
	const data = await db.selectFrom("guild_config").selectAll().where("guild", "=", guildId).executeTakeFirst();

	if (!data) {
		await db
			.insertInto("guild_config")
			.values({
				guild: guildId,
				features_randomuwu: false,
				features_starboard: false,
				features_github_expansion: false,
				starboard_emojis: JSON.stringify(["⭐"]),
				starboard_threshold: 5,
				chatbot_escape_character: "\\",
			})
			.executeTakeFirst();

		return getGuildConfig(guildId);
	}

	return data;
};
