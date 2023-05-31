import { server as hapi } from "@hapi/hapi";
import { defaultLogger } from "~/lib/logger";

export const startServer = async () => {
	const hs = hapi({ port: process.env.PORT ?? 3000 });

	hs.route({
		method: "GET",
		path: "/health",
		handler: () => {
			return { ok: true };
		},
	});

	await hs.start();
	defaultLogger.success(`Started server at ${hs.info.uri}`);
};
