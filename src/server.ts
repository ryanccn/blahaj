import { serve } from "@hono/node-server";
import { type Client, type Presence } from "discord.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { verify } from "argon2";
import { config } from "~/env";
import { get } from "~/lib/db";
import { defaultLogger } from "~/lib/logger";

const unreachable = (): never => {
	throw new Error("Impossible condition reached");
};

const serializePresence = (presence: Presence) => {
	return {
		status: presence.status,
		clientStatus: presence.clientStatus,

		activities: presence.activities.map(activity => ({
			name: activity.name,
			type: activity.type === 0
				? "playing" as const
				: activity.type === 1
				? "streaming" as const
				: activity.type === 2
				? "listening" as const
				: activity.type === 3
				? "watching" as const
				: activity.type === 4
				? "custom" as const
				: activity.type === 5
				? "competing" as const
				: unreachable(),
			url: activity.url,
			details: activity.details,
			state: activity.state,
			applicationId: activity.applicationId,
			timestamps: activity.timestamps,
			party: activity.party,
			assets: activity.assets
				? {
					largeText: activity.assets.largeText,
					smallText: activity.assets.smallText,
					largeImageURL: activity.assets.largeImageURL({ extension: "png" }),
					smallImageURL: activity.assets.smallImageURL({ extension: "png" }),
				}
				: null,
			flags: activity.flags,
			emoji: activity.emoji ? activity.emoji.toJSON() : activity.emoji,
			buttons: activity.buttons,
			createdTimestamp: activity.createdTimestamp,
		})),
	};
};

export const startServer = async ({ client }: { client: Client }) => {
	const app = new Hono();
	app.use("*", secureHeaders());

	app.get("/health", (c) => c.json({ ok: true }));

	app.use("/presence/:id", cors({ origin: "*" }));
	app.get("/presence/:id", async (c) => {
		const userId = c.req.param("id");

		if (!client.isReady()) return c.json({ error: "discord client not ready" }, 500);

		const token = c.req.header("authorization");
		if (!token || !token.startsWith("token ")) return c.json({ error: "needs authorization" }, 403);

		const tokenHash = await get(["presenceapi-token", userId]);
		if (typeof tokenHash !== "string") return c.json({ error: "not found" }, 404);

		if (!(await verify(tokenHash, token.slice(6)))) {
			return c.json({ error: "unauthorized" }, 401);
		}

		const guild = await client.guilds.fetch(config.GUILD_ID);
		const members = await guild.members.fetch();
		const member = members.get(userId);
		if (!member) return c.json({ error: "not found" }, 404);

		if (!member.presence) return c.json({ error: "not found" }, 404);

		return c.json(serializePresence(member.presence));
	});

	serve({
		fetch: app.fetch,
		port: config.PORT ? Number.parseInt(config.PORT) : 3000,
	}, (info) => {
		defaultLogger.success(`Started server at http://${info.address}:${info.port}`);
	});
};
