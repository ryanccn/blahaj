import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, EmbedBuilder } from "discord.js";
import { config } from "~/env";

export const handleButton = async (i: ButtonInteraction) => {
	const buttonId = i.customId;

	if (buttonId.startsWith("fren-accept::")) {
		const [, userId, date] = buttonId.split("::");

		if (!i.channel) return;
		if (i.user.id !== userId) return;

		if (Date.now() - Number.parseInt(date) > 7 * 24 * 60 * 60 * 1000) {
			await i.channel.send("The invite has expired! Please ask for a new one :>");

			setTimeout(() => {
				if (!i.channel) return;
				i.channel.delete();
			}, 5000);
			return;
		}

		if (!config.FREN_ROLE_ID) {
			throw new Error("No FREN_ROLE_ID configured!");
		}

		const guild = await i.client.guilds.fetch(config.GUILD_ID);
		const member = await guild.members.fetch(userId);

		await member.roles.add(config.FREN_ROLE_ID);

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
						.setDisabled(true),
				),
			],
		});

		await i.channel.send({
			content: `<@${userId}> You have been added to <@&${config.FREN_ROLE_ID}>. Have fun!`,
			allowedMentions: { roles: [], users: [userId] },
		});

		setTimeout(() => {
			if (!i.channel) return;
			i.channel.delete();
		}, 5000);
	} else if (buttonId.startsWith("fren-decline::")) {
		if (!i.channel) return;

		if (i.channel && i.channel.type === ChannelType.GuildText && i.channel.name.startsWith("fren-invitation-")) {
			await i.channel.delete();
		}
	} else if (buttonId.startsWith("self-timeout-cancel::")) {
		const [, userId] = buttonId.split("::");
		if (i.user.id !== userId) return;

		await i.update({
			embeds: [
				new EmbedBuilder()
					.setTitle("Self-timeout cancelled")
					.setDescription("Your self-timeout has been successfully cancelled!")
					.setColor(0x4ade80),
			],
			components: [],
		});
	} else if (buttonId.startsWith("self-timeout-proceed::")) {
		const [, userId, durationString] = buttonId.split("::");
		if (!i.guild || i.user.id !== userId) return;

		const durationMs = Number.parseInt(durationString);
		await i.guild.members.cache.get(userId)?.timeout(durationMs, "Requested self-timeout");
		const now = Math.floor(Date.now() / 1000);
		const durationS = Math.floor(durationMs / 1000);

		await i.update({
			embeds: [
				new EmbedBuilder()
					.setTitle("Self-timeout in effect")
					.addFields({ name: "Start", value: `<t:${now}:F> ` })
					.addFields({ name: "End", value: `<t:${now + durationS}:F> (<t:${now + durationS}:R>)` })
					.setColor(0x4ade80),
			],
			components: [],
		});
	}
};
