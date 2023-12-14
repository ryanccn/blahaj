import * as v from "valibot";

import { defaultLogger } from "~/lib/logger";
import { formatValiError } from "~/lib/utils";

const snowflake = v.string([v.regex(/^\d+$/, "Should be a snowflake, not a generic string")]);

const flagSchema = () =>
	v.transform(
		v.string([v.custom((value) => {
			const acceptable = ["1", "0", "true", "false", "on", "off"];
			return acceptable.includes(value.toLowerCase());
		}, "Invalid input flag")]),
		(value) => value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "on",
	);

const Config = v.object({
	NODE_ENV: v.string([v.minLength(1)]),
	PORT: v.optional(v.string([v.regex(/^\d+$/)])),

	DISCORD_TOKEN: v.string([v.minLength(1)]),
	REDIS_URL: v.optional(v.string([v.url()])),

	GOOGLE_CLOUD_PROJECT_ID: v.optional(v.string()),
	GOOGLE_CLOUD_CLIENT_EMAIL: v.optional(v.string()),
	GOOGLE_CLOUD_PRIVATE_KEY: v.optional(v.string()),

	GUILD_ID: snowflake,
	FREN_ROLE_ID: v.optional(snowflake),
	FREN_CATEGORY_ID: v.optional(snowflake),
	TEMPORARY_CATEGORY_ID: v.optional(snowflake),
	DM_LOGS_CHANNEL: v.optional(snowflake),
	ERROR_LOGS_CHANNEL: v.optional(snowflake),

	STARBOARD_CHANNEL: v.optional(snowflake),
	FREN_STARBOARD_CHANNEL: v.optional(snowflake),
	STARBOARD_EMOJIS: v.optional(v.string()),
	STARBOARD_THRESHOLD: v.optional(snowflake),

	OPENAI_TOKEN: v.optional(v.string()),
	CHATBOT_CHANNEL: v.optional(snowflake),
	CHATBOT_ESCAPE_CHAR: v.optional(v.string()),

	THREAD_CREATE_MESSAGE: v.optional(v.string()),

	STABLE_DIFFUSION_API_URL: v.optional(v.string([v.url()])),
	STABLE_DIFFUSION_API_TOKEN: v.optional(v.string()),

	VALFISK_MIGRATION_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: v.optional(flagSchema()),
});

type Config = v.Output<typeof Config>;

let config_: Config;

try {
	config_ = v.parse(Config, process.env);
} catch (error) {
	if (error instanceof v.ValiError) {
		defaultLogger.error(formatValiError(error));
		process.exit(1);
	} else {
		throw error;
	}
}

export const config: Readonly<typeof config_> = config_;
