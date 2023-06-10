import { EmbedBuilder, type Message } from "discord.js";

export const messageEmbed = async (message: Message) => {
	const embed = new EmbedBuilder()
		.setDescription(message.content || "*No content*")
		.setAuthor({
			name: message.member?.nickname ?? message.author.username,
			iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined,
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
				name: imageAttachment ? "Other Attachments" : "Attachments",
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

	return embed;
};
