import { EmbedBuilder, GuildTextBasedChannel, MessageCollector } from "discord.js";
import shuffle from "just-shuffle";
import { getTrivia } from "./data";

type TriviaChannelState = {
	name: string;
	questionIdx: number;
	data: { question: string; answers: string[] }[];
	scores: Map<string, number>;
};

const triviaState = new Map<string, TriviaChannelState>();
const triviaCollectors = new Map<string, MessageCollector>();

export const nextTrivia = async (channel: GuildTextBasedChannel) => {
	const state = triviaState.get(channel.id);
	if (!state) return;

	state.questionIdx++;

	if (state.questionIdx === state.data.length) {
		await stopTrivia(channel);
		return;
	}

	const thisQuestionIdx = state.questionIdx;
	await channel.send(state.data[thisQuestionIdx].question);

	setTimeout(async () => {
		if (state.questionIdx === thisQuestionIdx) {
			await channel.send(`The answer is ||${state.data[thisQuestionIdx].answers[0]}||`);
			await nextTrivia(channel);
		}
	}, 20_000);
};

export const startTrivia = async (name: string, channel: GuildTextBasedChannel) => {
	const data = await getTrivia(name);

	triviaState.set(channel.id, { name, questionIdx: -1, data: shuffle(data), scores: new Map() });
	await nextTrivia(channel);

	const collector = channel.createMessageCollector();
	triviaCollectors.set(channel.id, collector);

	collector.on("collect", async (message) => {
		const state = triviaState.get(channel.id);
		if (!state) {
			collector.stop();
			return;
		}

		if (state.data[state.questionIdx].answers.includes(message.cleanContent)) {
			await message.reply("Correct!");
			state.scores.set(message.author.id, (state.scores.get(message.author.id) ?? 0) + 1);

			await nextTrivia(channel);
		}
	});
};

export const stopTrivia = async (channel: GuildTextBasedChannel) => {
	const state = triviaState.get(channel.id);
	if (!state) return;

	await channel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle("Trivia stopped!")
				.setDescription(
					[...state.scores.entries()].map(([user, score]) => (`<@${user}>: **${score}**`)).join("\n"),
				)
				.setColor(0xc084fc),
		],
	});

	triviaState.delete(channel.id);

	const collector = triviaCollectors.get(channel.id);
	collector?.stop();
	triviaCollectors.delete(channel.id);
};
