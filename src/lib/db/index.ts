import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { Database, GuildConfig } from "./types";

import { LRUCache } from "lru-cache";

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL,
});
const dialect = new PostgresDialect({ pool });

export const db = new Kysely<Database>({ dialect });

const guildConfigCache = new LRUCache<string, GuildConfig>({
	max: 500,
	maxSize: 5000,
	sizeCalculation: (value) => {
		return JSON.stringify(value).length;
	},
	ttl: 1000,
	allowStale: false,
});

export const getGuildConfig = async (guildId: string): Promise<GuildConfig> => {
	const cacheValue = guildConfigCache.get(guildId);
	if (cacheValue) return cacheValue;

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

	guildConfigCache.set(guildId, data);
	return data;
};
