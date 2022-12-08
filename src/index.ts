import {
  Client,
  GatewayIntentBits,
  Partials,
  OAuth2Scopes,
  EmbedBuilder,
  PermissionFlagsBits,
  Events,
} from 'discord.js';

import 'dotenv/config';

import { pingCommand } from '~/commands/ping';
import { sayCommand } from '~/commands/say';
import { presenceCommand } from '~/commands/presence';
import { xkcdCommand } from '~/commands/xkcd';
import { infoCommand } from '~/commands/info';
import { flipCommand } from '~/commands/flip';
import { freehajCommand } from '~/commands/freehaj';

import { logMessage } from '~/db';

import { getHajEmoji } from '~/utils';
import { green, bold, yellow, cyan } from 'kleur/colors';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildBans,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(green('Discord bot ready!'));

  console.log(
    cyan(
      client.generateInvite({
        scopes: [OAuth2Scopes.Bot],
        permissions: [
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.BanMembers,
          PermissionFlagsBits.KickMembers,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.ModerateMembers,
          PermissionFlagsBits.MentionEveryone,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.SendMessagesInThreads,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      })
    )
  );

  if (process.env.NODE_ENV !== 'development') {
    console.warn(yellow(bold('Running in production mode!')));
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    try {
      if (commandName === 'ping') {
        await pingCommand(interaction);
      } else if (commandName === 'say') {
        await sayCommand(interaction);
      } else if (commandName === 'presence') {
        await presenceCommand(interaction);
      } else if (commandName === 'xkcd') {
        await xkcdCommand(interaction);
      } else if (commandName === 'info') {
        await infoCommand(interaction);
      } else if (commandName === 'freehaj') {
        await freehajCommand(interaction);
      } else if (commandName === 'flip') {
        await flipCommand(interaction);
      }
    } catch (e) {
      console.error(e);

      const errorEmbed = new EmbedBuilder()
        .setTitle(`${await getHajEmoji(interaction.guild!)} An error occurred!`)
        .setDescription('Hmm. What happened there?')
        .setColor(0xfa5252);

      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [errorEmbed],
        });
      } else if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
});

client.on(Events.MessageCreate, async (e) => {
  if (e.author.bot) return;
  await logMessage(e.author.id);
});

client.login(process.env.DISCORD_TOKEN).catch((e) => {
  console.error(e);
  process.exit(1);
});
