import {
	Colors,
	DiscordAPIError,
	EmbedBuilder,
	SnowflakeUtil,
	type Message,
} from "discord.js";
import {
	Configuration,
	OpenAIApi,
	type ChatCompletionRequestMessage,
} from "openai";

import { dim, yellow } from "kleur/colors";

const SYSTEM_MESSAGE =
	"You are a friendly Discord bot named Blåhaj in a small personal Discord guild called Ryanland. Your developer is Ryan Cao (username RyanCaoDev), the owner of the guild, and you were written in Discord.js. You mainly chat casually with members of the community and often make jokes (nicely). You should use very concise language. Due to the conversational nature of Discord, messages NOT BY YOU will be prefixed with the username or nickname of the author, folloed by a colon. You can treat the username as the name of the author. However, you should not not prefix the messages you send with any username whatsoever. You can use the emoji <a:catpat:1102492443523416114> to give members virtual pats when they feel down or ask for pets.";

let CHATBOT_ESCAPE_CHAR = "\\";
if (process.env.CHATBOT_ESCAPE_CHAR) {
	CHATBOT_ESCAPE_CHAR = process.env.CHATBOT_ESCAPE_CHAR;
}

const configuration = new Configuration({
	apiKey: process.env.OPENAI_TOKEN,
});

let openai: OpenAIApi | null = null;

if (process.env.OPENAI_TOKEN) {
	openai = new OpenAIApi(configuration);
}

const unproxiedMessages = new Set<string>();

class UnproxiedMessageError extends Error {
	name = "UnproxiedMessageError";
}

export const handleChat = async (message: Message) => {
	if (message.interaction) return;

	if (!openai) {
		console.warn(
			yellow(
				`No ${dim("`")}OPENAI_TOKEN${dim(
					"`"
				)} defined, not initializing chatbot`
			)
		);

		return;
	}
	if (message.content.startsWith(CHATBOT_ESCAPE_CHAR)) return;

	await message.channel.sendTyping();
	const typingTimer = setInterval(() => message.channel.sendTyping(), 5000);

	try {
		const msgs: Message<boolean>[] = [
			...(
				await message.channel.messages.fetch({
					after: SnowflakeUtil.generate({
						timestamp: Date.now() - 2.5 * 60 * 1000,
					}).toString(),
					before: message.id,
				})
			).values(),
		].reverse();

		if (
			msgs.length >= 2 &&
			msgs[msgs.length - 1].webhookId &&
			!msgs[msgs.length - 2].webhookId &&
			msgs[msgs.length - 2].content.includes(msgs[msgs.length - 1].content)
		) {
			unproxiedMessages.add(msgs[msgs.length - 2].id);
			msgs.splice(msgs.length - 2, 1);
		}

		const context = [
			...msgs
				.filter((k) => !k.content.startsWith(CHATBOT_ESCAPE_CHAR))
				.map<ChatCompletionRequestMessage>((msg) => {
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
				}),
		];

		if (unproxiedMessages.has(message.id)) {
			unproxiedMessages.delete(message.id);
			throw new UnproxiedMessageError();
		}

		const response = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: [{ role: "system", content: SYSTEM_MESSAGE }, ...context],
		});

		let responseMessage = response.data.choices[0].message?.content;
		if (!responseMessage) return;

		for (const incorrectPrefix of ["Blåhaj: ", "Blåhaj (Discord Bot): "]) {
			if (responseMessage.startsWith(incorrectPrefix)) {
				responseMessage = responseMessage.replace(incorrectPrefix, "");
			}
		}

		const isAppropriate = await openai
			.createModeration({ input: responseMessage })
			.then(({ data }) => !data.results[0].flagged);

		if (isAppropriate) {
			await message.reply({
				content: responseMessage,
				allowedMentions: { parse: ["users"], repliedUser: true },
			});
		} else {
			await message.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Response flagged!")
						.setDescription(
							"The generated response may have been inappropriate."
						)
						.setColor(Colors.Red),
				],
			});
		}

		clearInterval(typingTimer);
	} catch (e) {
		clearInterval(typingTimer);

		if (e instanceof DiscordAPIError && e.code === 50035) {
			console.warn(
				yellow(`Unable to reply to message, seems to have been deleted.`)
			);
		} else if (e instanceof UnproxiedMessageError) {
			console.warn(
				yellow(
					`Not replying to ${message.id} because it has been found to be a duplicate`
				)
			);
		} else {
			throw e;
		}
	}
};
