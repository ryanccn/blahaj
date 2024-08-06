import { EmbedBuilder, type Message, type User } from "discord.js";

const getUsername = (user: User) => (user.discriminator === "0" ? user.username : user.tag);

export const messageEmbed = async (message: Message) => {
	const embed = new EmbedBuilder()
		.setDescription(message.content || "*No content*")
		.setAuthor({
			name: getUsername(message.author)
				+ (message.channel.isDMBased()
					? message.author === message.client.user
						? ` → ${message.channel.recipient ? getUsername(message.channel.recipient) : "unknown"}`
						: ` → ${getUsername(message.client.user)}`
					: ""),

			iconURL: message.author.avatarURL() ?? undefined,
		})
		.setTimestamp(message.createdTimestamp);

	if (message.attachments.size > 0) {
		const imageAttachment = message.attachments.filter((att) => att.contentType?.startsWith("image/")).first();

		if (imageAttachment) {
			embed.setImage(imageAttachment.url);
		}

		const otherAttachments = message.attachments.filter((att) => att.id !== imageAttachment?.id);

		if (otherAttachments.size > 0) {
			embed.addFields({
				name: imageAttachment ? "Other attachments" : "Attachments",
				value: otherAttachments.map((att) => `[${att.name}](${att.url})`).join("\n"),
			});
		}
	}

	if (message.reference && message.reference.guildId === message.guildId) {
		const repliedToMessage = await message.fetchReference();

		embed.addFields({
			name: "Replying to",
			value: repliedToMessage.url,
		});
	}

	if (message.member) {
		const colorRoles = [...message.member.roles.cache.filter((v) => v.color !== 0).values()];
		colorRoles.sort((a, b) => b.comparePositionTo(a));

		const firstRole = colorRoles[0];
		if (firstRole) embed.setColor(firstRole.color);
	}

	return embed;
};
