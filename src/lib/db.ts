import { createStorage } from "unstorage";
import MemoryDriver from "unstorage/drivers/memory";
import RedisDriver from "unstorage/drivers/redis";

const storage = createStorage({
	driver: process.env.REDIS_URL
		? RedisDriver({ url: process.env.REDIS_URL })
		: MemoryDriver(),
});

const resolveKey = (k: string | string[]) =>
	typeof k === "string" ? k : k.join(":");
const environmentScopedKey = (k: string) => `${process.env.NODE_ENV}:${k}`;

export const get = async (k: string | string[]) => {
	return storage.getItem(environmentScopedKey(resolveKey(k)));
};

export const set = async (
	k: string | string[],
	v: string | number,
	ttl?: number
) => {
	const key = environmentScopedKey(resolveKey(k));
	await storage.setItem(key, v, { ttl });
};

export const incr = async (k: string | string[], delta?: number) => {
	const key = environmentScopedKey(resolveKey(k));
	let oldValue = await storage.getItem(key);

	if (oldValue === null) oldValue = 0;
	else if (typeof oldValue === "string") oldValue = parseInt(oldValue);

	if (typeof oldValue !== "number" || isNaN(oldValue))
		throw new Error(`${key} is not a number, cannot increment!`);

	await storage.setItem(key, oldValue + (delta ?? 1));
};

export const decr = async (k: string | string[]) => {
	await incr(k, -1);
};

export const del = async (k: string | string[]) => {
	await storage.removeItem(environmentScopedKey(resolveKey(k)));
};
