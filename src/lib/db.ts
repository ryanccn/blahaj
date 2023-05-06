import { createClient } from 'redis';

const _client = createClient({ url: process.env.REDIS_URL });
_client.on('error', (err) => {
  console.error(err);
});

const client = _client.connect().then(() => _client);

const resolveKey = (k: string | string[]) =>
  typeof k === 'string' ? k : k.join(':');
const environmentScopedKey = (k: string) => `${process.env.NODE_ENV}:${k}`;

export const get = async (k: string | string[]) => {
  return await (await client).get(environmentScopedKey(resolveKey(k)));
};

export const set = async (
  k: string | string[],
  v: string | number,
  ttl?: number
) => {
  const key = environmentScopedKey(resolveKey(k));
  await (await client).set(key, v);
  if (ttl) await (await client).expire(key, ttl);
};

export const incr = async (k: string | string[]) => {
  return await (await client).incr(environmentScopedKey(resolveKey(k)));
};

export const decr = async (k: string | string[]) => {
  return await (await client).decr(environmentScopedKey(resolveKey(k)));
};

export const del = async (k: string | string[]) => {
  await (await client).del(environmentScopedKey(resolveKey(k)));
};
