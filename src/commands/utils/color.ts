import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import sharp from "sharp";
import { SlashCommand } from "../_types";

const hexRegex = /^#(([\dA-Fa-f]{8})|([\dA-Fa-f]{6})|([\dA-Fa-f]{3,4}))$/;
export const colorCommand: SlashCommand = async (i) => {
	await i.deferReply();
	const input = i.options.getString("color", true);

	let fullString: string;
	let hexOnly: string;

	if (hexRegex.test(input)) {
		fullString = input;
		hexOnly = input.slice(1);
	} else if (hexRegex.test("#" + input)) {
		fullString = "#" + input;
		hexOnly = input;
	} else {
		await i.editReply("Invalid color provided!");
		return;
	}

	const image = await sharp({ create: { width: 256, height: 256, background: fullString, channels: 4 } })
		.png()
		.toBuffer();

	const normalizedHex =
		hexOnly.length === 8
			? hexOnly.slice(0, 6)
			: hexOnly.length === 6
			? hexOnly
			: [...hexOnly]
					.map((k) => `${k}${k}`)
					.join("")
					.slice(0, 6);

	const intColor = Number.parseInt(normalizedHex, 16);

	const file = new AttachmentBuilder(image).setName(`hex-${hexOnly}.png`);
	const embed = new EmbedBuilder()
		.setTitle(fullString)
		.setColor(intColor)
		.setThumbnail(`attachment://hex-${hexOnly}.png`);

	await i.editReply({ files: [file], embeds: [embed] });
};
