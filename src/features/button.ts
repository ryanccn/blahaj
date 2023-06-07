import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
} from "discord.js";

export const handleButton = async (i: ButtonInteraction) => {
	const buttonId = i.customId;

	if (buttonId.startsWith("fren-accept::")) {
		const [, userId, date] = buttonId.split("::");

		if (!i.channel) return;
		if (i.user.id !== userId) return;

		if (Date.now() - Number.parseInt(date) > 7 * 24 * 60 * 60 * 1000) {
			await i.channel.send(
				"The invite has expired! Please ask for a new one :>"
			);

			setTimeout(() => {
				if (!i.channel) return;
				i.channel.delete();
			}, 5000);
			return;
		}

		if (!process.env.FREN_ROLE_ID) {
			throw new Error("No FREN_ROLE_ID configured!");
		}

		const guild = await i.client.guilds.fetch(process.env.GUILD_ID);
		const member = await guild.members.fetch(userId);

		await member.roles.add(process.env.FREN_ROLE_ID);

		await i.update({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Success)
						.setLabel("Accept")
						.setCustomId(`fren-disabled-accept`)
						.setDisabled(true),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Danger)
						.setLabel("Decline")
						.setCustomId(`fren-disabled-decline`)
						.setDisabled(true)
				),
			],
		});

		await i.channel.send({
			content: `<@${userId}> You have been added to <@&${process.env.FREN_ROLE_ID}>. Have fun!`,
			allowedMentions: { roles: [], users: [userId] },
		});

		setTimeout(() => {
			if (!i.channel) return;
			i.channel.delete();
		}, 5000);
	} else if (buttonId.startsWith("fren-decline::")) {
		if (!i.channel) return;

		if (
			i.channel &&
			i.channel.type === ChannelType.GuildText &&
			i.channel.name.startsWith("fren-invitation-")
		) {
			await i.channel.delete();
		}
	}
};
