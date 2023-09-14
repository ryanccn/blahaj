import { EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../_types";

interface ImageResponse {
	id: number;
	source: string;
	tag_string: string;
	file_url: string;
}

const fetchRandomShiggy = async () => {
	const url = new URL("https://safebooru.donmai.us/posts/random.json");
	url.searchParams.append("tags", "kemomimi-chan_(naga_u)");
	url.searchParams.append("tags", "naga_u");
	url.searchParams.append("only", "id,source,tag_string,file_url");

	const resp = await fetch(url);
	if (!resp.ok) return null;

	const data = await resp.json() as ImageResponse;

	return data;
};

export const shiggyCommand: SlashCommand = async (i) => {
	await i.deferReply();
	const shiggy = await fetchRandomShiggy();

	if (!shiggy) {
		await i.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Could not fetch shiggy!")
					.setDescription("An error occurred while fetching from the API.")
					.setColor(0xef4444),
			],
		});

		return;
	}

	await i.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle(`${shiggy.id}`)
				.addFields({ name: "Tags", value: shiggy.tag_string })
				.addFields({ name: "Source", value: shiggy.source })
				.setURL(`https://safebooru.donmai.us/posts/${shiggy.id}`)
				.setImage(shiggy.file_url),
		],
	});
};
