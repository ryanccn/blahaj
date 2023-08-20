import { type Message } from "discord.js";

import { openai } from "~/lib/openai";

import { destr } from "destr";
import * as v from "valibot";

import { config } from "~/env";
import { Logger } from "~/lib/logger";

const SYSTEM_MESSAGE =
	"You are a smart moderation natural language Discord bot responding to instructions from server moderators. Make no function calls if the message does not make sense.";

const logger = new Logger("smartModeration");

export const handleSmartModeration = async (message: Message) => {
	if (!config.SMART_MODERATION_ENABLE) return;
	if (!message.guild) return;

	if (!openai) {
		logger.warn("No OPENAI_TOKEN defined, not responding to smart moderation request");
		return;
	}

	const { guild, channel, content } = message;

	const response = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: [
			{ role: "system", content: SYSTEM_MESSAGE },
			{ role: "user", content },
		],
		functions: [
			{
				name: "ban",
				parameters: {
					type: "object",
					properties: {
						id: { type: "string", description: "User ID" },
						reason: { type: "string" },
						deleteMessageSeconds: {
							type: "number",
							description: "Duration of messages to delete in seconds",
						},
					},
					required: ["id"],
				},
			},
			{
				name: "timeout",
				parameters: {
					type: "object",
					properties: {
						id: { type: "string", description: "User ID" },
						duration: { type: "number", description: "Duration of timeout in milliseconds" },
						reason: { type: "string" },
					},
					required: ["id", "duration"],
				},
			},
			{
				name: "kick",
				parameters: {
					type: "object",
					properties: {
						id: { type: "string", description: "User ID" },
						reason: { type: "string" },
					},
					required: ["id"],
				},
			},
		],
	});

	const { function_call } = response.choices[0].message;
	if (!function_call) return;

	let failed = false;

	logger.info(function_call);

	try {
		switch (function_call.name) {
			case "ban": {
				const schema = v.object({
					id: v.string([v.minLength(1)]),
					reason: v.optional(v.string([v.minLength(1)])),
					deleteMessageSeconds: v.optional(v.number()),
				});
				const data = v.parse(schema, destr(function_call.arguments));

				await guild.members.ban(data.id, {
					reason: data.reason,
					deleteMessageSeconds: data.deleteMessageSeconds,
				});

				break;
			}

			case "timeout": {
				const schema = v.object({
					id: v.string([v.minLength(1)]),
					duration: v.number(),
					reason: v.optional(v.string([v.minLength(1)])),
				});
				const data = v.parse(schema, destr(function_call.arguments));

				const member = await guild.members.fetch(data.id);
				await member.timeout(data.duration, data.reason);

				break;
			}

			case "kick": {
				const schema = v.object({
					id: v.string([v.minLength(1)]),
					reason: v.optional(v.string([v.minLength(1)])),
				});
				const data = v.parse(schema, destr(function_call.arguments));

				await guild.members.kick(data.id, data.reason);

				break;
			}

			default: {
				logger.error("Received unknown function call", function_call.name);
				failed = true;
			}
		}
	} catch (error) {
		logger.error(error);
		failed = true;
	}

	await channel.send({
		content: failed ? "❌ Failed" : "✅ Success",
	});
};
