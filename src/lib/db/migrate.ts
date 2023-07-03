import { Kysely, Migrator, PostgresDialect, FileMigrationProvider } from "kysely";
import { Pool } from "pg";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { Database } from "./types";
import { Logger } from "~/lib/logger";

const logger = new Logger("migrate");

export const migrateToLatest = async () => {
	const db = new Kysely<Database>({
		dialect: new PostgresDialect({
			pool: new Pool({
				connectionString: process.env.POSTGRES_URL,
			}),
		}),
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(process.cwd(), "src", "migrations"),
		}),
	});

	const { results, error } = await migrator.migrateToLatest();

	if (results) {
		for (const it of results) {
			if (it.status === "Success") {
				logger.info(`Migration "${it.migrationName}" was executed successfully`);
			} else if (it.status === "Error") {
				logger.error(`Failed to execute migration "${it.migrationName}"`);
			}
		}
	} else if (error) {
		logger.error("Failed to execute migrations");
		logger.error(error);
		process.exit(1);
	}

	await db.destroy();
};
