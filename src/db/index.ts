import { MongoClient, ServerApiVersion } from 'mongodb';
import { differenceInSeconds, addSeconds, getUnixTime } from 'date-fns';

interface MemberDocument {
  id: string;
  xp: number;
  hajs: number;
}
interface EconomyDailyDocument {
  id: string;
  lastUsed: Date | null;
}

const mongoCli = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: ServerApiVersion.v1,
});

const client = mongoCli.connect();
const _membersCollection = client
  .then((k) => k.db().collection<MemberDocument>('members'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
const _economyDailyCollection = client
  .then((k) => k.db().collection<EconomyDailyDocument>('economy_daily'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

const ensureMemberExists = async (id: string) => {
  const members = await _membersCollection;
  const f = await members.findOne({ id });
  if (!f) {
    await members.insertOne({ id, xp: 0, hajs: 0 });
  }
};

const ensureEconomyDataExists = async (id: string) => {
  await ensureMemberExists(id);
  const collection = await _economyDailyCollection;
  const d = await collection.findOne({ id });
  if (!d) {
    await collection.insertOne({ id, lastUsed: null });
  }
};

export const logMessage = async (id: string) => {
  await ensureMemberExists(id);
  await (await _membersCollection).updateOne({ id }, { $inc: { xp: 10 } });
};

export const getInfo = async (id: string) => {
  await ensureMemberExists(id);
  return await (await _membersCollection).findOne({ id });
};

export const flip = async (id: string, bet: number) => {
  if (bet <= 0) return 'error';

  const info = await getInfo(id);

  if (!info) return 'error';
  if (info.hajs < bet) return 'error';

  const win = Math.random() >= 0.5;

  await (
    await _membersCollection
  ).updateOne({ id }, { $inc: { hajs: win ? +bet : -bet } });

  return win ? 'win' : 'loss';
};

export const freehaj = async (id: string) => {
  await ensureEconomyDataExists(id);

  const [collection, membersCollection] = await Promise.all([
    _economyDailyCollection,
    _membersCollection,
  ]);
  const userInfo = await collection.findOne({ id });
  if (!userInfo) throw new Error('User not found in database!');

  const secondsSinceLastUse =
    userInfo.lastUsed !== null
      ? differenceInSeconds(new Date(), userInfo.lastUsed)
      : Infinity;

  if (secondsSinceLastUse < 60 * 60) {
    return getUnixTime(addSeconds(userInfo.lastUsed!, 60 * 60));
  }

  await collection.updateOne({ id }, { $set: { lastUsed: new Date() } });

  await membersCollection.updateOne({ id }, { $inc: { hajs: 100 } });
  return true;
};
