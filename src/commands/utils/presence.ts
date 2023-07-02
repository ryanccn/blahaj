import { ActivityType, EmbedBuilder, type Client } from "discord.js";

import { del, get, set } from "~/lib/db/redis";

import capitalize from "just-capitalize";
import { z } from "zod";

import type { SlashCommand } from "../_types";

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
		embeds: [
			new EmbedBuilder()
				.setTitle("Presence updated!")
				.addFields({ name: "Type", value: capitalize(type) })
				.addFields({ name: "Content", value: content })
				.setTimestamp(new Date()),
		],
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
