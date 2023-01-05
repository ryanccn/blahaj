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
import { bottomCommand } from '~/commands/bottom';

import { parseSDMetadata } from '~/sdMetadata';
import { handleCatstareAdd, handleCatstareRemove } from '~/catstareboard';
import { handleButton } from '~/button';

import { getGuildEmoji } from '~/utils';
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
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
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
      } else if (commandName === 'bottom') {
        await bottomCommand(interaction);
      }
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    }
  } catch (e) {
    console.error(e);

    const errorEmbed = new EmbedBuilder()
      .setTitle(
        `${await getGuildEmoji(interaction.guild!, 'haj')} An error occurred!`
      )
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
  if (e.guildId !== GUILDS[0]) return;
  await parseSDMetadata(e);
});

client.on(Events.MessageReactionAdd, async (e) => {
  e = await e.fetch();
  if (e.message.guildId !== GUILDS[0]) return;
  if (!e.message.channelId || !e.message.guild) return;
  if (
    !e.message.guild.roles.everyone
      .permissionsIn(e.message.channelId)
      .has(PermissionFlagsBits.ViewChannel)
  )
    return;

  await handleCatstareAdd(e);
});

client.on(Events.MessageReactionRemove, async (e) => {
  e = await e.fetch();
  if (e.message.guildId !== GUILDS[0]) return;
  if (!e.message.channel || !e.message.guild) return;
  if (
    !e.message.guild.roles.everyone
      .permissionsIn(e.message.channelId)
      .has(PermissionFlagsBits.ViewChannel)
  )
    return;

  await handleCatstareRemove(e);
});

client.on(Events.GuildBanAdd, async (ban) => {
  for (const guild of GUILDS) {
    if (ban.guild.id === guild) continue;

    try {
      const relayGuild = await client.guilds.fetch(guild);
      await relayGuild.bans.create(ban.user, { reason: '(synced)' });
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
