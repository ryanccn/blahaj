import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import sharp from "sharp";
import { SlashCommand } from "../_types";
import namedColors from "../../lib/namedColors.json" assert { type: "json" };

function getHexCodeForColor(colorName: string) {
	colorName = colorName.toLowerCase();
	for (const hexCode in namedColors) {
		const colorNames = (namedColors as { [key: string]: string[] })[hexCode].map((name) => name.toLowerCase());
		if (colorNames.includes(colorName)) return hexCode;
	}
	return null;
}

function getNamesForHexCode(hexCode: string) {
	hexCode = hexCode.toUpperCase();
	if (hexCode in namedColors) {
		return (namedColors as { [key: string]: string[] })[hexCode];
	}
	return [];
}

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
	} else if (getHexCodeForColor(input)) {
		fullString = getHexCodeForColor(input) as string;
		hexOnly = fullString.slice(1);
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
	if (getNamesForHexCode(fullString).length > 0) {
		embed.setDescription(getNamesForHexCode(fullString).join("/"));
	}
	await i.editReply({ files: [file], embeds: [embed] });
};
