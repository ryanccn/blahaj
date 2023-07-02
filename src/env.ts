import { z, ZodError } from "zod";

import { defaultLogger } from "~/lib/logger";
import { formatZodError } from "~/lib/utils";

const snowflake = z.string().regex(/^\d+$/, "Should be a snowflake, not a generic string");

const env = z.object({
	NODE_ENV: z.string().min(1).default("production"),
	PORT: z.string().regex(/^\d+$/).optional(),

	DISCORD_TOKEN: z.string().min(1),
	POSTGRES_URL: z.string().url(),
	REDIS_URL: z.string().url().optional(),

	GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
	GOOGLE_CLOUD_CLIENT_EMAIL: z.string().optional(),
	GOOGLE_CLOUD_PRIVATE_KEY: z.string().optional(),

	GUILD_ID: snowflake,
	DM_LOGS_CHANNEL: snowflake.optional(),
	ERROR_LOGS_CHANNEL: snowflake.optional(),

	STABLE_DIFFUSION_API_URL: z.string().url().optional(),
	STABLE_DIFFUSION_API_TOKEN: z.string().optional(),
});

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface ProcessEnv extends z.infer<typeof env> {}
	}
}

export const validateEnv = () => {
	try {
		env.parse(process.env);
	} catch (error) {
		if (error instanceof ZodError) {
			defaultLogger.error(formatZodError(error));
			process.exit(1);
		} else {
			throw error;
		}
	}
};
