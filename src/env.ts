import { z, ZodError } from "zod";
import { formatZodError } from "~/lib/utils";

const snowflake = z
	.string()
	.regex(/^\d+$/, "Should be a snowflake, not a generic string");

const env = z.object({
	NODE_ENV: z.string().min(1),
	PORT: z.string().regex(/^\d+$/).optional(),

	DISCORD_APP: z.string().min(1),
	DISCORD_TOKEN: z.string().min(1),
	REDIS_URL: z.string().url(),

	GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
	GOOGLE_CLOUD_CLIENT_EMAIL: z.string().optional(),
	GOOGLE_CLOUD_PRIVATE_KEY: z.string().optional(),

	GUILD_ID: snowflake,
	FREN_ROLE_ID: snowflake.optional(),
	FREN_CATEGORY_ID: snowflake.optional(),
	TEMPORARY_CATEGORY_ID: snowflake.optional(),
	DM_LOGS_CHANNEL: snowflake.optional(),
	ERROR_LOGS_CHANNEL: snowflake.optional(),

	STARBOARD_CHANNEL: snowflake.optional(),
	FREN_STARBOARD_CHANNEL: snowflake.optional(),
	STARBOARD_EMOJIS: z.string().optional(),
	STARBOARD_THRESHOLD: snowflake.optional(),

	OPENAI_TOKEN: z.string().optional(),
	CHATBOT_CHANNEL: snowflake.optional(),
	CHATBOT_ESCAPE_CHAR: z.string().optional(),

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
	} catch (e: unknown) {
		if (e instanceof ZodError) {
			console.error(formatZodError(e));
			process.exit(1);
		} else {
			throw e;
		}
	}
};
