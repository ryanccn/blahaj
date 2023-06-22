import { ActivityType, type Client } from "discord.js";

import { del, get, set } from "~/lib/db";
import { successEmbed } from "~/lib/utils";

import type { SlashCommand } from "./_types";
import { z } from "zod";

const setPresence = ({ content, type, client }: { content: string; type: string; client: Client }) => {
	if (!client.user) return;

	const parsedType =
		type === "playing"
			? ActivityType.Playing
			: type === "streaming"
			? ActivityType.Streaming
			: type === "listening"
			? ActivityType.Listening
			: type === "watching"
			? ActivityType.Watching
			: type === "competing"
			? ActivityType.Competing
			: ActivityType.Playing;

	client.user.setPresence({
		activities: [{ type: parsedType, name: content }],
	});
};

export const presenceCommand: SlashCommand = async (i) => {
	await i.deferReply({ ephemeral: true });

	const type = i.options.getString("type") ?? "playing";
	const content = i.options.getString("content", true);

	setPresence({ type, content, client: i.client });
	await set(["presence", "v1"], JSON.stringify({ type, content }));

	await i.editReply({
		embeds: [successEmbed("Presence updated!", `${type ?? "Playing"} **${content}**`)],
	});
};

const PresenceData = z.object({ type: z.string(), content: z.string() });

export const restorePresence = async (client: Client) => {
	const storedData = PresenceData.safeParse(await get(["presence", "v1"]));
	if (!storedData.success) {
		await del(["presence", "v1"]);
		return;
	}

	setPresence({ ...storedData.data, client });
};
