import { Colors, DiscordAPIError, EmbedBuilder, type Message, SnowflakeUtil } from "discord.js";
import { type OpenAI } from "openai";
import { openai } from "~/lib/openai";

import { config } from "~/env";
import { Logger } from "~/lib/logger";

const SYSTEM_MESSAGE =
	"You are a friendly Discord bot named Blåhaj in a small personal Discord guild called Ryanland. Your developer is Ryan Cao (username RyanCaoDev), the owner of the guild, and you were written in Discord.js. You mainly chat casually with members of the community and often make jokes (nicely). You should use very concise language. Due to the conversational nature of Discord, messages NOT BY YOU will be prefixed with the username or nickname of the author, folloed by a colon. You can treat the username as the name of the author. However, you should not not prefix the messages you send with any username whatsoever (e.g. \"Blåhaj\" or \"Blåhaj (Bot)\"). You can use the emoji <a:catpat:1102492443523416114> to give members virtual pats when they feel down or ask for pets.";

let CHATBOT_ESCAPE_CHAR = "\\";
if (config.CHATBOT_ESCAPE_CHAR) {
	CHATBOT_ESCAPE_CHAR = config.CHATBOT_ESCAPE_CHAR;
}

const logger = new Logger("chat");

const unproxiedMessages = new Set<string>();

class UnproxiedMessageError extends Error {
	name = "UnproxiedMessageError";
}

export const handleChat = async (message: Message) => {
	if (message.interaction) return;

	if (!openai) {
		logger.warn("No OPENAI_TOKEN defined, not responding with chatbot");
		return;
	}

	if (message.content.startsWith(CHATBOT_ESCAPE_CHAR)) return;

	await message.channel.sendTyping();
	const typingTimer = setInterval(() => message.channel.sendTyping(), 5000);

	try {
		const msgs: Message<boolean>[] = [
			...(await message.channel.messages
				.fetch({
					after: SnowflakeUtil.generate({
						timestamp: Date.now() - 2.5 * 60 * 1000,
					}).toString(),
					before: message.id,
				})
				.then((res) => res.values())),
		].reverse();

		if (
			msgs.length >= 2
			&& msgs.at(-1)!.webhookId
			&& !msgs.at(-2)!.webhookId
			&& msgs.at(-2)!.content.includes(msgs.at(-1)!.content)
		) {
			unproxiedMessages.add(msgs.at(-2)!.id);
			msgs.splice(-2, 1);
		}

		const context = msgs
			.filter((k) => !k.content.startsWith(CHATBOT_ESCAPE_CHAR))
			.map<OpenAI.Chat.ChatCompletionMessageParam>((msg) => {
				if (msg.author === msg.author.client.user) {
					return { role: "assistant", content: msg.content };
				}
				const roles = msg.member?.roles.cache.map((role) => role.name);

				return {
					role: "user",
					content: `${msg.member?.nickname ?? msg.author.username}${
						roles?.length ? ` (${roles.join(", ")})` : ""
					}: ${msg.content}`,
				};
			});

		if (unproxiedMessages.has(message.id)) {
			unproxiedMessages.delete(message.id);
			throw new UnproxiedMessageError();
		}

		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [{ role: "system", content: SYSTEM_MESSAGE }, ...context],
		});

		const { content } = response.choices[0].message;

		if (content) {
			const isAppropriate = await openai.moderations
				.create({ input: content })
				.then(({ results }) => !results[0].flagged);

			// eslint-disable-next-line unicorn/prefer-ternary
			if (isAppropriate) {
				await message.reply({
					content,
					allowedMentions: { parse: [], repliedUser: true },
				});
			} else {
				await message.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Response flagged!")
							.setDescription("The generated response may have been inappropriate.")
							.setColor(Colors.Red),
					],
				});
			}
		}

		clearInterval(typingTimer);
	} catch (error) {
		clearInterval(typingTimer);

		if (error instanceof DiscordAPIError && error.code === 50035) {
			logger.warn("Unable to reply to message, seems to have been deleted.");
		} else if (error instanceof UnproxiedMessageError) {
			logger.warn(`Not replying to ${message.id} because it has been found to be a duplicate`);
		} else {
			throw error;
		}
	}
};
