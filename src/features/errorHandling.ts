import {
	EmbedBuilder,
	ChannelType,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	type CacheType,
	type Client,
	type Message,
} from "discord.js";

const HEX_RED = 0xfa5252;

type HandleableInteraction =
	| ChatInputCommandInteraction<CacheType>
	| ButtonInteraction<CacheType>
	| ContextMenuCommandInteraction<CacheType>;

export const respondWithError = async (interaction: HandleableInteraction) => {
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
	interaction,
	message,
}: {
	client: Client;
	error: unknown;
	interaction?: HandleableInteraction;
	message?: Message;
}) => {
	if (!process.env.ERROR_LOGS_CHANNEL) return;

	const logsChannel = await client.channels.fetch(process.env.ERROR_LOGS_CHANNEL);
	if (!logsChannel || logsChannel.type !== ChannelType.GuildText)
		throw new Error(
			`Specified error logging channel ${process.env.ERROR_LOGS_CHANNEL} does not exist or is not a text channel!`
		);

	const embed = new EmbedBuilder()
		.setTitle("An error occurred!")
		.setDescription("```\n" + (error instanceof Error ? error.stack : error) + "\n```")
		.setColor(HEX_RED)
		.setTimestamp(Date.now());

	if (interaction) {
		embed.addFields({ name: "User", value: `${interaction.user}` });
		embed.addFields({ name: "Channel", value: `${interaction.channel}` });

		if (interaction instanceof ChatInputCommandInteraction) {
			embed.addFields({ name: "Command", value: `${interaction.commandName}` });
		} else if (interaction instanceof ButtonInteraction) {
			embed.addFields({ name: "Button ID", value: `${interaction.customId}` });
			embed.addFields({ name: "Message", value: interaction.message.url });
		} else if (interaction instanceof ContextMenuCommandInteraction) {
			if (interaction.isMessageContextMenuCommand())
				embed.addFields({ name: "Message", value: interaction.targetMessage.url });
			else if (interaction.isUserContextMenuCommand())
				embed.addFields({ name: "Message", value: `${interaction.targetUser}` });
		}
	}

	if (message) {
		embed.addFields({ name: "Message", value: message.url });
	}

	await logsChannel.send({
		embeds: [embed],
	});
};
