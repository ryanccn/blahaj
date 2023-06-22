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
import { presenceCommand, restorePresence } from "~/commands/presence";
import { statsCommand } from "~/commands/stats";
import { bottomCommand } from "~/commands/bottom";
import { uwurandomCommand } from "~/commands/uwurandom";
import { translateCommand } from "~/commands/translate";
import { frenAdd } from "~/commands/fren";
import { stableDiffusionCommand } from "~/commands/stableDiffusion";
import { pomeloCommand } from "~/commands/pomelo";

import { parseSDMetadata } from "~/features/sdMetadata";
import { handleChat } from "~/features/chat";
import { handleGitHubExpansion } from "~/features/githubExpansion";
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
		if (message.channel.id !== process.env.CHATBOT_CHANNEL) return;
		if (message.author.bot && !message.webhookId) return;

		await handleChat(message);
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

try {
	await Promise.all([startServer(), reuploadCommands()]);
	await client.login(process.env.DISCORD_TOKEN);
} catch (error) {
	defaultLogger.error(error);
	process.exit(1);
}
