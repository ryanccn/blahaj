import {
  Client,
  Options,
  GatewayIntentBits,
  Partials,
  Events,
  OAuth2Scopes,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';

import 'dotenv/config';

import { pingCommand } from '~/commands/ping';
import { sayCommand } from '~/commands/say';
import { presenceCommand } from '~/commands/presence';

import { handleButton } from '~/button';

import { getHajEmoji } from '~/utils';
import { green, bold, yellow, cyan } from 'kleur/colors';
import { parseSDMetadata } from './sdMetadata';

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
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 3600,
      lifetime: 1800,
    },
  },
});

if (!process.env.DISCORD_GUILDS) {
  throw new Error('DISCORD_GUILDS not defined!');
}

const GUILDS = process.env.DISCORD_GUILDS.split(',');

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
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      if (commandName === 'ping') {
        await pingCommand(interaction);
      } else if (commandName === 'say') {
        await sayCommand(interaction);
      } else if (commandName === 'presence') {
        await presenceCommand(interaction);
      }
    } else if (interaction.isButton()) {
      await handleButton(interaction);
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
});

client.on(Events.MessageCreate, async (e) => {
  if (e.author.bot) return;
  await parseSDMetadata(e);
});

client.on(Events.GuildBanAdd, async (ban) => {
  for (const guild of GUILDS) {
    if (ban.guild.id === guild) continue;

    try {
      const relayGuild = await client.guilds.fetch(guild);
      await relayGuild.bans.create(ban.user, {
        reason: `${ban.reason} (synced)`,
      });
    } catch (e) {
      console.error(e);
    }
  }
});

client.on(Events.GuildBanRemove, async (ban) => {
  for (const guild of GUILDS) {
    if (ban.guild.id === guild) continue;

    try {
      const relayGuild = await client.guilds.fetch(guild);
      await relayGuild.bans.remove(ban.user, `(synced)`);
    } catch (e) {
      console.error(e);
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch((e) => {
  console.error(e);
  process.exit(1);
});
