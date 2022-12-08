import { MongoClient, ServerApiVersion } from 'mongodb';

export interface MemberDocument {
  id: string;
  xp: number;
  hajs: number;
}

const mongoCli = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: ServerApiVersion.v1,
});

const client = mongoCli.connect();
const collection = client
  .then((k) => k.db().collection<MemberDocument>('members'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

export const ensureMemberExists = async (id: string) => {
  const f = await (await collection).findOne({ id });
  if (!f) {
    await (await collection).insertOne({ id, xp: 0, hajs: 0 });
  }
};

export const logMessage = async (id: string) => {
  await ensureMemberExists(id);
  await (await collection).updateOne({ id }, { $inc: { xp: 10 } });
};

export const getInfo = async (id: string) => {
  await ensureMemberExists(id);
  return await (await collection).findOne({ id });
};

export const exchange = async (id: string, hajs: number) => {
  if (hajs <= 0) return false;

  const info = await getInfo(id);

  if (!info) return false;
  if (info.xp / 100 < hajs) return false;

  await (
    await collection
  ).updateOne({ id }, { $inc: { hajs: hajs, xp: hajs * -100 } });

  return true;
};

export const flip = async (id: string, bet: number) => {
  if (bet <= 0) return 'error';

  const info = await getInfo(id);

  if (!info) return 'error';
  if (info.hajs < bet) return 'error';

  const win = Math.random() >= 0.5;

  await (
    await collection
  ).updateOne({ id }, { $inc: { hajs: win ? +bet : -bet } });

  return win ? 'win' : 'loss';
};
