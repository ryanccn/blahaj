import {
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	PermissionFlagsBits,
	Routes,
	SlashCommandBuilder,
} from "discord.js";

import { REST } from "@discordjs/rest";
import type { RESTGetAPIOAuth2CurrentApplicationResult } from "discord-api-types/v10";

import { defaultLogger } from "~/lib/logger";

import "dotenv/config";
import { config } from "~/env";

export const reuploadCommands = async () => {
	const commands = [
		new SlashCommandBuilder().setName("ping").setDescription("Replies with pong!"),
		new SlashCommandBuilder()
			.setName("say")
			.setDescription("Say something through the bot")
			.addStringOption((opt) => opt.setName("content").setDescription("The content to send").setRequired(true))
			.addUserOption((opt) => opt.setName("dm").setDescription("DM this message to a specific user").setRequired(false))
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		new SlashCommandBuilder()
			.setName("presence")
			.setDescription("Set the Rich Presence of the bot")
			.addStringOption((opt) => opt.setName("content").setDescription("The content of the presence").setRequired(true))
			.addStringOption((opt) =>
				opt
					.setName("type")
					.setDescription("The type of the presence")
					.setRequired(false)
					.addChoices(
						...["Playing", "Streaming", "Listening", "Watching", "Competing", "Custom"].map((k) => ({
							name: k,
							value: k.toLowerCase(),
						})),
					)
			)
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		new SlashCommandBuilder().setName("stats").setDescription("Get system statistics and information"),
		new SlashCommandBuilder()
			.setName("bottom")
			.setDescription("🥺")
			.addSubcommand((subcommand) =>
				subcommand
					.setName("encode")
					.setDescription("Encode UTF-8 into the Bottom Encoding Standard 🥺")
					.addStringOption((option) => option.setName("content").setDescription("UTF-8 content").setRequired(true))
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("decode")
					.setDescription("Decode from the Bottom Encoding Standard into UTF-8 🥺")
					.addStringOption((option) => option.setName("content").setDescription("BES content").setRequired(true))
			),
		new SlashCommandBuilder()
			.setName("uwurandom")
			.setDescription("Generate text from /dev/uwurandom")
			.addIntegerOption((option) =>
				option
					.setName("length")
					.setDescription("Desired length of text")
					.setRequired(true)
					.setMinValue(1)
					.setMaxValue(1000)
			),
		new SlashCommandBuilder()
			.setName("stable-diffusion")
			.setDescription("Stable Diffusion")
			.addStringOption((option) =>
				option.setName("prompt").setDescription("The prompt").setRequired(true).setMaxLength(500)
			)
			.addStringOption((option) =>
				option.setName("negative-prompt").setDescription("The negative prompt").setRequired(false).setMaxLength(500)
			)
			.addIntegerOption((option) => option.setName("seed").setDescription("The random seed").setRequired(false))
			.addBooleanOption((option) =>
				option.setName("upscale").setDescription("Whether to upscale by 2x or not").setRequired(false)
			),
		new SlashCommandBuilder().setName("pomelo").setDescription("Statistics on the username migration in this guild"),
		new SlashCommandBuilder()
			.setName("fren")
			.setDescription("fren management")
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.addSubcommand((subcommand) =>
				subcommand
					.setName("add")
					.setDescription("add a fren")
					.addUserOption((option) => option.setName("user").setDescription("user to add to fren").setRequired(true))
			),
		new SlashCommandBuilder()
			.setName("self-timeout")
			.setDescription("Time yourself out")
			.addStringOption((option) =>
				option.setName("duration").setDescription("Duration of the timeout").setRequired(true)
			),
		new SlashCommandBuilder()
			.setName("presence-api")
			.setDescription("Manage access to the presence API"),
		new SlashCommandBuilder()
			.setName("color")
			.setDescription("Show a color")
			.addStringOption((option) =>
				option.setName("color").setDescription("Hexadecimal representation of the color").setRequired(true)
			),
		new SlashCommandBuilder()
			.setName("shiggy")
			.setDescription("random shiggy"),
		new ContextMenuCommandBuilder().setName("Translate").setType(ApplicationCommandType.Message),
	]
		.map((command) => command.setDMPermission(false))
		.map((command) => command.toJSON());

	const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

	const { id: appId } = (await rest.get(Routes.oauth2CurrentApplication())) as RESTGetAPIOAuth2CurrentApplicationResult;

	await rest.put(Routes.applicationCommands(appId), {
		body: commands,
	});

	defaultLogger.success(
		`Successfully registered ${commands.length} application command${commands.length === 1 ? "" : "s"}`,
	);
};
