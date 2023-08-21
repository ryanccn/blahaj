import {
	ButtonInteraction,
	type CacheType,
	type Channel,
	ChannelType,
	ChatInputCommandInteraction,
	type Client,
	ContextMenuCommandInteraction,
	EmbedBuilder,
	type Message,
} from "discord.js";
import { config } from "~/env";

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

interface BaseLogErrorOptions {
	client: Client;
	error: unknown;
}

interface InteractionLogError extends BaseLogErrorOptions {
	interaction: HandleableInteraction;
}
interface MessageLogError extends BaseLogErrorOptions {
	message: Message;
}
interface ChannelLogError extends BaseLogErrorOptions {
	channel: Channel;
}

export const logErrorToDiscord = async (
	opts: BaseLogErrorOptions | InteractionLogError | MessageLogError | ChannelLogError,
) => {
	if (!config.ERROR_LOGS_CHANNEL) return;

	const logsChannel = await opts.client.channels.fetch(config.ERROR_LOGS_CHANNEL);
	if (!logsChannel || logsChannel.type !== ChannelType.GuildText) {
		throw new Error(
			`Specified error logging channel ${config.ERROR_LOGS_CHANNEL} does not exist or is not a text channel!`,
		);
	}

	const embed = new EmbedBuilder()
		.setTitle("An error occurred!")
		.setDescription("```\n" + (opts.error instanceof Error ? opts.error.stack : opts.error) + "\n```")
		.setColor(HEX_RED)
		.setTimestamp(Date.now());

	if ("interaction" in opts) {
		embed.addFields({ name: "User", value: `${opts.interaction.user}` });
		embed.addFields({ name: "Channel", value: `${opts.interaction.channel}` });

		if (opts.interaction instanceof ChatInputCommandInteraction) {
			embed.addFields({ name: "Command", value: `${opts.interaction.commandName}` });
		} else if (opts.interaction instanceof ButtonInteraction) {
			embed.addFields({ name: "Button ID", value: `\`${opts.interaction.customId}\`` });
			embed.addFields({ name: "Message", value: opts.interaction.message.url });
		} else if (opts.interaction instanceof ContextMenuCommandInteraction) {
			if (opts.interaction.isMessageContextMenuCommand()) {
				embed.addFields({ name: "Message", value: opts.interaction.targetMessage.url });
			} else if (opts.interaction.isUserContextMenuCommand()) {
				embed.addFields({ name: "Message", value: `${opts.interaction.targetUser}` });
			}
		}
	} else if ("message" in opts) {
		embed.addFields({ name: "Message", value: opts.message.url });
	} else if ("channel" in opts) {
		embed.addFields({ name: "Channel", value: `${opts.channel}` });
	}

	await logsChannel.send({
		embeds: [embed],
	});
};
