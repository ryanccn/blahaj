import {
	EmbedBuilder,
	type CacheType,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type Client,
	ChannelType,
} from "discord.js";

const HEX_RED = 0xfa5252;

type HandleableInteractions =
	| ChatInputCommandInteraction<CacheType>
	| ButtonInteraction<CacheType>
	| ContextMenuCommandInteraction<CacheType>;

export const respondWithError = async (interaction: HandleableInteractions) => {
	const errorEmbed = new EmbedBuilder()
		.setTitle("An error occurred!")
		.setDescription("Hmm. What happened there?")
		.setColor(HEX_RED);

	if (interaction.deferred) {
		await interaction.editReply({
			embeds: [errorEmbed],
		});
	} else if (!interaction.replied) {
		await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
	}
};

export const logErrorToDiscord = async ({
	client,
	error,
}: {
	client: Client;
	error: unknown;
}) => {
	if (!process.env.ERROR_LOGS_CHANNEL) return;

	const logsChannel = await client.channels.fetch(
		process.env.ERROR_LOGS_CHANNEL
	);
	if (!logsChannel || logsChannel.type !== ChannelType.GuildText)
		throw new Error(
			`Specified error logging channel ${process.env.ERROR_LOGS_CHANNEL} does not exist or is not a text channel!`
		);

	if (error instanceof Error) {
		await logsChannel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle("An error occurred!")
					.setDescription("```\n" + (error.stack ?? error.toString()) + "\n```")
					.setColor(HEX_RED)
					.setTimestamp(Date.now()),
			],
		});
	}
};
