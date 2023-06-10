import { EmbedBuilder } from "discord.js";
import type { SlashCommand } from "./_types";

export const pomeloCommand: SlashCommand = async (i) => {
	if (!i.guild) {
		throw new Error("No guild available!");
	}

	await i.deferReply();

	const members = await i.guild.members.fetch();
	const pomeloed = members.filter((v) => v.user.discriminator === "0");

	await i.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle("Username migration / Pomelo")
				.setDescription(
					`**${pomeloed.size}** out of ${members.size} members (${(
						(pomeloed.size / members.size) *
						100
					).toFixed(1)}%) of **${
						i.guild.name
					}** have had their usernames migrated to [the new format](https://discord.com/blog/usernames).`
				)
				.addFields({
					name: "Migrated users",
					value: pomeloed.map((m) => `${m}`).join(" "),
				})
				.setTimestamp(new Date())
				.setColor(0x2dd4bf),
		],
	});
};
