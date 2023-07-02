import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database, GuildConfig } from "./types";

import { defaultLogger } from "../logger";

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL,
});
pool.on("connect", () => {
	defaultLogger.success("Connected to Postgres database");
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
				starboard_emojis: JSON.stringify(["⭐"]),
				starboard_threshold: 5,
				chatbot_escape_character: "\\",
			})
			.executeTakeFirst();

		return getGuildConfig(guildId);
	}

	return data;
};
