import {
  PermissionFlagsBits,
  type Client,
  ChannelType,
  GuildTextBasedChannel,
} from 'discord.js';
import { uwurandom } from '~/lib/uwurandom';

const randomlyUwu = async (client: Client) => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channelPool = await guild.channels.fetch().then((channels) =>
    channels.filter((channel) => {
      if (!channel) return false;
      if (channel.type !== ChannelType.GuildText) return false;

      const everyonePermissions = channel.permissionsFor(guild.id, false);
      const frenPermissions = process.env.FREN_ROLE_ID
        ? channel.permissionsFor(process.env.FREN_ROLE_ID, false)
        : null;
      const requiredPermissions =
        PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;

      return (
        everyonePermissions?.has(requiredPermissions) ||
        frenPermissions?.has(requiredPermissions)
      );
    })
  );

  const randomChannel = channelPool.random() as
    | GuildTextBasedChannel
    | null
    | undefined;
  if (!randomChannel) return;

  await randomChannel.send(uwurandom(20 + Math.random() * 80));
};

export const initRandomUwu = (client: Client) => {
  setInterval(() => {
    if (Math.random() > 0.001) return;
    randomlyUwu(client);
  }, 5 * 60 * 1000);
};
