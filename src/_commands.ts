import {
  SlashCommandBuilder,
  Routes,
  PermissionFlagsBits,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} from 'discord.js';
import { REST } from '@discordjs/rest';

import 'dotenv/config';
import { green } from 'kleur/colors';

export const reuploadCommands = async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Replies with pong!'),
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('Say something through the bot')
      .addStringOption((opt) =>
        opt
          .setName('content')
          .setDescription('The content to send')
          .setRequired(true)
      )
      .addUserOption((opt) =>
        opt
          .setName('dm')
          .setDescription('DM this message to a specific user')
          .setRequired(false)
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
      .setName('stats')
      .setDescription('Get system statistics and information'),
    new SlashCommandBuilder()
      .setName('bottom')
      .setDescription('🥺')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('encode')
          .setDescription('Encode UTF-8 into the Bottom Encoding Standard 🥺')
          .addStringOption((option) =>
            option
              .setName('content')
              .setDescription('UTF-8 content')
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('decode')
          .setDescription(
            'Decode from the Bottom Encoding Standard into UTF-8 🥺'
          )
          .addStringOption((option) =>
            option
              .setName('content')
              .setDescription('BES content')
              .setRequired(true)
          )
      ),
    new SlashCommandBuilder()
      .setName('uwurandom')
      .setDescription('Generate text from /dev/uwurandom')
      .addIntegerOption((option) =>
        option
          .setName('length')
          .setDescription('Desired length of text')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(1000)
      ),
    new SlashCommandBuilder()
      .setName('stable-diffusion')
      .setDescription('Stable Diffusion')
      .addStringOption((option) =>
        option
          .setName('prompt')
          .setDescription('The prompt')
          .setRequired(true)
          .setMaxLength(500)
      )
      .addStringOption((option) =>
        option
          .setName('negative-prompt')
          .setDescription('The negative prompt')
          .setRequired(false)
          .setMaxLength(500)
      )
      .addIntegerOption((option) =>
        option
          .setName('seed')
          .setDescription('The random seed')
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName('upscale')
          .setDescription('Whether to upscale by 2x or not')
          .setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('fren')
      .setDescription('fren management')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName('add')
          .setDescription('add a fren')
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('user to add to fren')
              .setRequired(true)
          )
      ),
    new ContextMenuCommandBuilder()
      .setName('Translate')
      .setType(ApplicationCommandType.Message),
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
