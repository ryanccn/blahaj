import { AttachmentBuilder, EmbedBuilder, type Message } from "discord.js";
import sharp from "sharp";

const hexRegex = /#(([\da-f]{8})|([\da-f]{6})|([\da-f]{3,4}))/g;

export const handleColors = async (message: Message) => {
	const hexes = message.content.matchAll(hexRegex);

	const embeds: EmbedBuilder[] = [];
	const files: AttachmentBuilder[] = [];

	for (const [fullStr, hex] of hexes) {
		const image = await sharp({ create: { width: 256, height: 256, background: fullStr, channels: 4 } })
			.png()
			.toBuffer();

		const normalizedHex =
			hex.length === 8
				? hex.slice(0, 6)
				: hex.length === 6
				? hex
				: [...hex]
						.map((k) => `${k}${k}`)
						.join("")
						.slice(0, 6);

		const intColor = Number.parseInt(normalizedHex, 16);

		files.push(new AttachmentBuilder(image).setName(`hex-${hex}.png`));
		embeds.push(new EmbedBuilder().setTitle(fullStr).setColor(intColor).setThumbnail(`attachment://hex-${hex}.png`));
	}

	if (embeds.length > 0) {
		await message.reply({ files, embeds, allowedMentions: { repliedUser: false } });
	}
};
