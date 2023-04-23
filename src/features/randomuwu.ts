import {
  PermissionFlagsBits,
  type Client,
  ChannelType,
  GuildTextBasedChannel,
} from 'discord.js';
import { uwurandom } from '~/lib/uwurandom';

const randomlyUwu = async (client: Client) => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const publiclyViewableChannels = await guild.channels
    .fetch()
    .then((channels) =>
      channels.filter((channel) => {
        if (!channel) return false;
        if (!('permissionsFor' in channel)) return false;
        if (channel.type !== ChannelType.GuildText) return false;

        const everyonePermissions = channel.permissionsFor(guild.id, false);
        return (
          everyonePermissions &&
          everyonePermissions.has(PermissionFlagsBits.SendMessages)
        );
      })
    );

  const randomChannel = publiclyViewableChannels.random() as
    | GuildTextBasedChannel
    | null
    | undefined;
  if (!randomChannel) return;

  await randomChannel.send(uwurandom(20 + Math.random() * 80));
};

export const initRandomUwu = (client: Client) => {
  setInterval(() => {
    if (Math.random() > 0.05) return;
    randomlyUwu(client);
  }, 5 * 60 * 1000);
};
