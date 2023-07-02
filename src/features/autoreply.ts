import { type Message } from "discord.js";
import random from "just-random";

export const handleAutoreply = async (message: Message) => {
	if (message.content.toLowerCase().includes("hetzner")) {
		await message.reply({
			content: random([
				"hetzner bad",
				"hetzner terrible",
				"hetzner horrible",
				"hetzner sucks",
				"don't use hetzner",
				"hetzner <:bleh:1032974662122098698>",
				"hetzner horror",
			]),
			allowedMentions: { repliedUser: false },
		});
	}
};
