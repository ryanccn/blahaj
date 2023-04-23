import {
  CategoryChannel,
  PermissionFlagsBits,
  type Client,
  type UserResolvable,
  type TextChannel,
} from 'discord.js';
import { nanoid } from 'nanoid';

export const createTemporaryChannel = async ({
  client,
  viewableUser,
  prefix,
}: {
  client: Client;
  viewableUser: UserResolvable;
  prefix: string;
}): Promise<TextChannel> => {
  if (!process.env.GUILD_ID || !process.env.TEMPORARY_CATEGORY_ID)
    throw new Error(
      'GUILD_ID or TEMPORARY_CATEGORY_ID not configured properly!'
    );

  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const temporaryCategory = await guild.channels.fetch(
    process.env.TEMPORARY_CATEGORY_ID
  );

  if (!temporaryCategory)
    throw new Error(
      `Could not find (temporary) category with ID \`${process.env.TEMPORARY_CATEGORY_ID}\``
    );
  if (!(temporaryCategory instanceof CategoryChannel))
    throw new Error(
      `#${temporaryCategory.id} is not a (temporary) category channel!`
    );

  const channel = await guild.channels.create({
    name: prefix + nanoid(8),
    parent: temporaryCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: viewableUser,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages],
      },
      {
        id: client.user!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
      },
    ],
  });

  return channel;
};
