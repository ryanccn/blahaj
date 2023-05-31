import { validateEnv } from "~/env";
import "dotenv/config";
validateEnv();

import {
	Client,
	Options,
	GatewayIntentBits,
	Partials,
	Events,
	OAuth2Scopes,
	PermissionFlagsBits,
	ChannelType,
} from "discord.js";

import { reuploadCommands } from "~/commands";
import { startServer } from "~/server";

import { pingCommand } from "~/commands/ping";
import { sayCommand } from "~/commands/say";
import { presenceCommand } from "~/commands/presence";
import { statsCommand } from "~/commands/stats";
import { bottomCommand } from "~/commands/bottom";
import { uwurandomCommand } from "~/commands/uwurandom";
import { translateCommand } from "~/commands/translate";
import { frenAdd } from "~/commands/fren";
import { stableDiffusionCommand } from "~/commands/stableDiffusion";

import { parseSDMetadata } from "~/features/sdMetadata";
import { handleChat } from "~/features/chat";
import { handleStarAdd, handleStarRemove } from "~/features/starboard";
import { initRandomUwu } from "~/features/randomuwu";
import { handleButton } from "~/features/button";
import { logDM } from "~/features/logDM";
import { logErrorToDiscord, respondWithError } from "~/features/errorHandling";

import { defaultLogger } from "~/lib/logger";

import { cyan } from "kleur/colors";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
	],
	partials: [Partials.Channel, Partials.Message, Partials.Reaction],
	sweepers: {
		...Options.DefaultSweeperSettings,
		messages: {
			interval: 3600,
			lifetime: 1800,
		},
	},
});

client.once(Events.ClientReady, async () => {
	defaultLogger.success("Connected to Discord gateway!");

	defaultLogger.info(
		"Invite link:",
		cyan(
			client.generateInvite({
				scopes: [OAuth2Scopes.Bot],
				permissions: [
					PermissionFlagsBits.AddReactions,
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.BanMembers,
					PermissionFlagsBits.KickMembers,
					PermissionFlagsBits.CreatePublicThreads,
					PermissionFlagsBits.CreatePrivateThreads,
					PermissionFlagsBits.EmbedLinks,
					PermissionFlagsBits.ManageChannels,
					PermissionFlagsBits.ManageRoles,
					PermissionFlagsBits.ModerateMembers,
					PermissionFlagsBits.MentionEveryone,
					PermissionFlagsBits.MuteMembers,
					PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.SendMessagesInThreads,
					PermissionFlagsBits.ReadMessageHistory,
				],
			})
		)
	);

	if (process.env.NODE_ENV !== "development") {
		defaultLogger.warn("Running in production mode!");
	}

	initRandomUwu(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	try {
		const { commandName } = interaction;

		if (commandName === "ping") {
			await pingCommand(interaction);
		} else if (commandName === "say") {
			await sayCommand(interaction);
		} else if (commandName === "presence") {
			await presenceCommand(interaction);
		} else if (commandName === "stats") {
			await statsCommand(interaction);
		} else if (commandName === "bottom") {
			await bottomCommand(interaction);
		} else if (commandName === "uwurandom") {
			await uwurandomCommand(interaction);
		} else if (commandName === "fren") {
			const sub = interaction.options.getSubcommand();
			if (sub === "add") await frenAdd(interaction);
		} else if (commandName === "stable-diffusion") {
			await stableDiffusionCommand(interaction);
		}
	} catch (error) {
		defaultLogger.error(error);
		await Promise.all([
			respondWithError(interaction),
			logErrorToDiscord({ client, error }),
		]);
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isButton()) return;

	try {
		await handleButton(interaction);
	} catch (error) {
		defaultLogger.error(error);
		await Promise.all([
			respondWithError(interaction),
			logErrorToDiscord({ client, error }),
		]);
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isMessageContextMenuCommand()) return;

	try {
		const { commandName } = interaction;

		if (commandName === "Translate") {
			await translateCommand(interaction);
		}
	} catch (error) {
		defaultLogger.error(error);
		await Promise.all([
			respondWithError(interaction),
			logErrorToDiscord({ client, error }),
		]);
	}
});

client.on(Events.MessageCreate, async (e) => {
	try {
		if (e.author.bot) return;
		await parseSDMetadata(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

client.on(Events.MessageCreate, async (e) => {
	try {
		if (e.channel.type !== ChannelType.GuildText) return;
		if (e.channel.id !== process.env.CHATBOT_CHANNEL) return;
		if (e.author.bot && !e.webhookId) return;

		await handleChat(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (message.channel.type !== ChannelType.DM) return;
		await logDM(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

client.on(Events.MessageReactionAdd, async (e) => {
	try {
		if (e.partial) e = await e.fetch();
		if (!e.message.channelId || !e.message.guild) return;

		await handleStarAdd(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

client.on(Events.MessageReactionRemove, async (e) => {
	try {
		if (e.partial) e = await e.fetch();
		if (!e.message.channel || !e.message.guild) return;

		await handleStarRemove(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

Promise.all([
	startServer(),
	reuploadCommands().then(() => client.login(process.env.DISCORD_TOKEN)),
]).catch((e) => {
	defaultLogger.error(e);
	process.exit(1);
});
