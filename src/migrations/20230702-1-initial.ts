import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("guild_config")
		.addColumn("guild", "text", (c) => c.unique().notNull().primaryKey())
		.addColumn("features_randomuwu", "boolean", (c) => c.notNull().defaultTo(false))
		.addColumn("features_starboard", "boolean", (c) => c.notNull().defaultTo(false))
		.addColumn("temporary_category", "text")
		.addColumn("fren_category", "text")
		.addColumn("fren_role_id", "text")
		.addColumn("fren_starboard_channel", "text")
		.addColumn("starboard_channel", "text")
		.addColumn("starboard_emojis", "json", (c) => c.defaultTo("[]"))
		.addColumn("starboard_threshold", "integer", (c) => c.defaultTo(5))
		.addColumn("chatbot_token", "text")
		.addColumn("chatbot_channel", "text")
		.addColumn("chatbot_escape_character", "text", (c) => c.defaultTo("\\"))
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable("guild_config").execute();
}
