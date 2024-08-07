import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import redisDriver from "unstorage/drivers/redis";

import { config } from "~/env";

const storage = createStorage({
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	driver: config.REDIS_URL
		? redisDriver({ url: config.REDIS_URL })
		: fsDriver({ base: "./.unstorage" }),
});

const resolveKey = (k: string | string[]) => (typeof k === "string" ? k : k.join(":"));
const scopeToEnv = (k: string[]) => [config.NODE_ENV, ...k];

export const get = async (k: string[]) => {
	return storage.getItem(resolveKey(scopeToEnv(k)));
};

export const set = async (k: string[], v: string | number, ttl?: number) => {
	const key = resolveKey(scopeToEnv(k));
	await storage.setItem(key, v, { ttl });
};

export const incr = async (k: string[], delta?: number) => {
	const key = resolveKey(scopeToEnv(k));
	let oldValue = await storage.getItem(key);

	if (oldValue === null) oldValue = 0;
	else if (typeof oldValue === "string") oldValue = Number.parseInt(oldValue);

	if (typeof oldValue !== "number" || Number.isNaN(oldValue)) {
		throw new TypeError(`${key} is not a number, cannot increment!`);
	}

	await storage.setItem(key, oldValue + (delta ?? 1));
};

export const decr = async (k: string[]) => {
	await incr(k, -1);
};

export const del = async (k: string[]) => {
	await storage.removeItem(resolveKey(scopeToEnv(k)));
};

export const keys = async () => {
	const dbKeys = await storage.getKeys(config.NODE_ENV);
	return dbKeys.length;
};
