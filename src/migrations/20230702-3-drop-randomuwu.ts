import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema.alterTable("guild_config").dropColumn("features_randomuwu").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable("guild_config")
		.addColumn("features_randomuwu", "boolean", (c) => c.notNull().defaultTo(false))
		.execute();
}
