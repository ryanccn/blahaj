import { SlashCommandBuilder, Routes, PermissionFlagsBits } from 'discord.js';
import { REST } from '@discordjs/rest';

import 'dotenv/config';
import { green } from 'kleur/colors';

export const reuploadCommands = async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Replies with pong!'),
    new SlashCommandBuilder()
      .setName('xkcd')
      .setDescription('Send a comic from XKCD')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('ID of the comic')
          .setMinValue(0)
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('Say something, yeah')
      .addStringOption((opt) =>
        opt
          .setName('content')
          .setDescription('The content to send')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder()
      .setName('presence')
      .setDescription('Set the Rich Presence of the bot')
      .addStringOption((opt) =>
        opt
          .setName('content')
          .setDescription('The content of the presence')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('The type of the presence')
          .setRequired(false)
          .addChoices(
            ...[
              'Playing',
              'Streaming',
              'Listening',
              'Watching',
              'Competing',
            ].map((k) => ({ name: k, value: k }))
          )
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('info')
      .setDescription('Display info about a member of Ryanland')
      .addUserOption((opt) =>
        opt
          .setName('user')
          .setDescription('The user to query for')
          .setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('exchange')
      .setDescription('Get hajs from levels!')
      .addNumberOption((opt) =>
        opt
          .setName('value')
          .setDescription('The value of hajs to buy')
          .setMinValue(0)
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('flip')
      .setDescription('Flip a coin with your hajs!')
      .addStringOption((opt) =>
        opt
          .setName('choice')
          .setDescription('Your bet for the coin')
          .setChoices(
            { name: 'Heads', value: 'heads' },
            { name: 'Tails', value: 'tails' }
          )
          .setRequired(true)
      )
      .addNumberOption((opt) =>
        opt
          .setName('bet')
          .setDescription('The value of hajs to bet')
          .setMinValue(0)
          .setRequired(true)
      ),
  ]
    .map((command) => command.setDMPermission(false))
    .map((command) => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  await rest.put(Routes.applicationCommands(process.env.DISCORD_APP!), {
    body: commands,
  });

  console.log(green('Successfully registered application commands.'));
};

reuploadCommands().catch((e) => {
  console.error(e);
  process.exit(1);
});
