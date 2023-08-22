import "dotenv/config";
import { config } from "~/env";

import {
	ChannelType,
	Client,
	Events,
	GatewayIntentBits,
	OAuth2Scopes,
	Partials,
	PermissionFlagsBits,
} from "discord.js";

import { reuploadCommands } from "~/commands";
import { startServer } from "~/server";

import { bottomCommand } from "~/commands/fun/bottom";
import { uwurandomCommand } from "~/commands/fun/uwurandom";

import { colorCommand } from "~/commands/utils/color";
import { pingCommand } from "~/commands/utils/ping";
import { pomeloCommand } from "~/commands/utils/pomelo";
import { presenceCommand, restorePresence } from "~/commands/utils/presence";
import { presenceApiCommand } from "~/commands/utils/presenceApi";
import { sayCommand } from "~/commands/utils/say";
import { selfTimeoutCommand } from "~/commands/utils/selfTimeout";
import { statsCommand } from "~/commands/utils/stats";
import { translateCommand } from "~/commands/utils/translate";

import { frenAdd } from "~/commands/fren";
import { stableDiffusionCommand } from "~/commands/stableDiffusion";

import { handleButton } from "~/features/button";
import { handleChat } from "~/features/chat";
import { logErrorToDiscord, respondWithError } from "~/features/errorHandling";
import { handleGitHubExpansion } from "~/features/githubExpansion";
import { logDM } from "~/features/logDM";
import { initRandomUwu } from "~/features/randomuwu";
import { parseSDMetadata } from "~/features/sdMetadata";
import { handleSmartModeration } from "~/features/smartModeration";
import { handleStarAdd, handleStarRemove } from "~/features/starboard";
import { handleThreadCreate } from "~/features/threadCreate";

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
			}),
		),
	);

	if (config.NODE_ENV !== "development") {
		defaultLogger.warn("Running in production mode!");
	}
});

client.once(Events.ClientReady, () => {
	initRandomUwu(client);
});

client.once(Events.ClientReady, async () => {
	try {
		await restorePresence(client);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error });
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	try {
		const { commandName, options } = interaction;

		switch (commandName) {
			case "ping": {
				await pingCommand(interaction);
				break;
			}
			case "say": {
				await sayCommand(interaction);
				break;
			}
			case "presence": {
				await presenceCommand(interaction);
				break;
			}
			case "stats": {
				await statsCommand(interaction);
				break;
			}
			case "bottom": {
				await bottomCommand(interaction);
				break;
			}
			case "uwurandom": {
				await uwurandomCommand(interaction);
				break;
			}
			case "fren": {
				const sub = options.getSubcommand();
				if (sub === "add") await frenAdd(interaction);
				break;
			}
			case "stable-diffusion": {
				await stableDiffusionCommand(interaction);
				break;
			}
			case "pomelo": {
				await pomeloCommand(interaction);
				break;
			}
			case "self-timeout": {
				await selfTimeoutCommand(interaction);
				break;
			}
			case "color": {
				await colorCommand(interaction);
				break;
			}
			case "presence-api": {
				await presenceApiCommand(interaction);
				break;
			}
			default: {
				defaultLogger.warn(`Received unknown command ${commandName}`);
			}
		}
	} catch (error) {
		defaultLogger.error(error);
		await Promise.all([respondWithError(interaction), logErrorToDiscord({ client, error, interaction })]);
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isButton()) return;

	try {
		await handleButton(interaction);
	} catch (error) {
		defaultLogger.error(error);
		await Promise.all([respondWithError(interaction), logErrorToDiscord({ client, error, interaction })]);
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
		await Promise.all([respondWithError(interaction), logErrorToDiscord({ client, error, interaction })]);
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (message.author.bot) return;
		await parseSDMetadata(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message });
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (message.author === message.client.user) return;
		await handleGitHubExpansion(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message });
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (message.channel.type !== ChannelType.GuildText) return;
		if (message.channel.id !== config.CHATBOT_CHANNEL) return;
		if (message.author.bot && !message.webhookId) return;

		await handleChat(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message });
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (!config.SMART_MODERATION_ENABLE) return;
		if (message.channel.type !== ChannelType.GuildText) return;
		if (!message.mentions.users.has(message.client.user.id)) return;
		if (!message.member || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

		await handleSmartModeration(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message });
	}
});

client.on(Events.MessageCreate, async (message) => {
	try {
		if (message.channel.type !== ChannelType.DM) return;
		await logDM(message);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message });
	}
});

client.on(Events.ThreadCreate, async (channel) => {
	try {
		if (channel.guildId !== config.GUILD_ID) return;

		await handleThreadCreate(channel);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, channel });
	}
});

client.on(Events.MessageReactionAdd, async (e) => {
	try {
		if (e.partial) e = await e.fetch();
		if (!e.message.channelId || !e.message.guild) return;

		await handleStarAdd(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message: await e.message.fetch() });
	}
});

client.on(Events.MessageReactionRemove, async (e) => {
	try {
		if (e.partial) e = await e.fetch();
		if (!e.message.channel || !e.message.guild) return;

		await handleStarRemove(e);
	} catch (error) {
		defaultLogger.error(error);
		await logErrorToDiscord({ client, error, message: await e.message.fetch() });
	}
});

const main = async () => {
	try {
		await Promise.all([startServer({ client }), reuploadCommands()]);
		await client.login(config.DISCORD_TOKEN);
	} catch (error) {
		defaultLogger.error(error);
		process.exit(1);
	}
};

main();
