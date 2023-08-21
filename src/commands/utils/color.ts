import { ColorTranslator } from "colortranslator";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import sharp from "sharp";
import { SlashCommand } from "../_types";

const customColors: {
	[key: string]: string;
} = {
	transparent: "#00000000",
};

export const colorCommand: SlashCommand = async (i) => {
	await i.deferReply();
	const input = i.options.getString("color", true);

	let fullColor: ColorTranslator;

	if (input in customColors) {
		fullColor = new ColorTranslator(customColors[input]);
	} else {
		try {
			fullColor = new ColorTranslator(input);
		} catch {
			try {
				fullColor = new ColorTranslator("#" + input);
			} catch {
				await i.editReply("Invalid color provided!");
				return;
			}
		}
	}

	const image = await sharp({ create: { width: 256, height: 256, background: fullColor.HEXA, channels: 4 } })
		.png()
		.toBuffer();

	const file = new AttachmentBuilder(image).setName(`hex-${fullColor.HEXA.slice(1)}.png`);
	const embed = new EmbedBuilder()
		.setTitle(fullColor.HEXA)
		.setColor(Number.parseInt(fullColor.HEX.slice(1), 16))
		.setThumbnail(`attachment://hex-${fullColor.HEXA.slice(1)}.png`);
	await i.editReply({ files: [file], embeds: [embed] });
};
