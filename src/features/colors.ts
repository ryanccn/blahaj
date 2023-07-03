import { AttachmentBuilder, EmbedBuilder, type Message } from "discord.js";
import sharp from "sharp";
import { getGuildConfig } from "~/lib/db";

const hexRegex = /#([\da-f]+)/g;

export const handleColors = async (message: Message) => {
	if (!message.guildId) return;

	const hexes = message.content.matchAll(hexRegex);
	const { features_colors } = await getGuildConfig(message.guildId);

	if (!features_colors) return;

	const embeds: EmbedBuilder[] = [];
	const files: AttachmentBuilder[] = [];

	for (const hex of hexes) {
		const image = await sharp({ create: { width: 256, height: 256, background: hex[0], channels: 4 } })
			.png()
			.toBuffer();

		files.push(new AttachmentBuilder(image).setName(`hex-${hex[1]}.png`));
		embeds.push(
			new EmbedBuilder()
				.setTitle(hex[0])
				.setColor(Number.parseInt(hex[1], 16))
				.setThumbnail(`attachment://hex-${hex[1]}.png`)
		);
	}

	if (embeds.length > 0) {
		await message.reply({ files, embeds });
	}
};
