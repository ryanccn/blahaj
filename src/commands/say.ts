import type { SlashCommand } from "./_types";

export const sayCommand: SlashCommand = async (i) => {
	if (!i.channel || !i.channel.isTextBased()) return;

	await i.deferReply({ ephemeral: true });

	const text = i.options.getString("content", true);
	const dmUser = i.options.getUser("dm");

	let channel = i.channel;
	if (dmUser !== null) {
		channel = await dmUser.createDM();
	}

	await channel.send(text);

	await i.editReply("Message sent!");
};
