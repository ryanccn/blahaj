import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { createTemporaryChannel } from "~/lib/tmpChannel";
import type { SlashCommand } from "./_types";

const frenAddMessage = (id: string) =>
	`
Hello there <@${id}>!

Ryan, the owner of Ryanland, has invited you to **the private friends category** of the server! You will get the \`@fren\` role and gain access to a few new private channels.

You received this invitation because Ryan has deemed you to be a fun and nice person in general.

This invite expires in 7 days. You are free to accept or ignore this invitation, no pressure :p
`.trim();

export const frenAdd: SlashCommand = async (i) => {
	await i.deferReply({ ephemeral: true });
	const user = i.options.getUser("user", true);

	const channel = await createTemporaryChannel({
		client: i.client,
		viewableUser: user,
		prefix: "fren-invitation-",
	});

	await channel.send({
		content: frenAddMessage(user.id),
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Success)
					.setLabel("Accept")
					.setCustomId(`fren-accept::${user.id}::${Date.now()}`),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Danger)
					.setLabel("Decline")
					.setCustomId(`fren-decline::${user.id}::${Date.now()}`)
			),
		],
	});

	await i.editReply({
		content: `Fren request sent to <@${user.id}>!`,
		allowedMentions: { parse: [] },
	});
};
