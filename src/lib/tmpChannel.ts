import { ChannelType, type Client, PermissionFlagsBits, type TextChannel, type UserResolvable } from "discord.js";
import { nanoid } from "nanoid";
import { config } from "~/env";

export const createTemporaryChannel = async ({
	client,
	viewableUser,
	prefix,
}: {
	client: Client;
	viewableUser: UserResolvable;
	prefix: string;
}): Promise<TextChannel> => {
	if (!config.GUILD_ID || !config.TEMPORARY_CATEGORY_ID) {
		throw new Error("GUILD_ID or TEMPORARY_CATEGORY_ID not configured properly!");
	}

	const guild = await client.guilds.fetch(config.GUILD_ID);

	const temporaryCategory = await guild.channels.fetch(config.TEMPORARY_CATEGORY_ID);

	if (!temporaryCategory) {
		throw new Error(`Could not find (temporary) category with ID \`${config.TEMPORARY_CATEGORY_ID}\``);
	}
	if (temporaryCategory.type !== ChannelType.GuildCategory) {
		throw new Error(`#${temporaryCategory.name} (${temporaryCategory.id}) is not a (temporary) category channel!`);
	}

	const channel = await guild.channels.create({
		name: prefix + nanoid(8),
		parent: temporaryCategory,
		permissionOverwrites: [
			{
				id: guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: viewableUser,
				allow: [PermissionFlagsBits.ViewChannel],
				deny: [PermissionFlagsBits.SendMessages],
			},
			{
				id: client.user!.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
			},
		],
	});

	return channel;
};
