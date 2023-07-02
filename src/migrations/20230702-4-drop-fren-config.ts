import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable("guild_config")
		.dropColumn("fren_role_id")
		.dropColumn("fren_starboard_channel")
		.dropColumn("fren_category")
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable("guild_config")
		.addColumn("fren_category", "text")
		.addColumn("fren_role_id", "text")
		.addColumn("fren_starboard_channel", "text")
		.execute();
}
