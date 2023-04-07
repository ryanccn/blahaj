import { validateEnv } from '~/env';
import 'dotenv/config';
validateEnv();

import {
  Client,
  Options,
  GatewayIntentBits,
  Partials,
  Events,
  OAuth2Scopes,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

import { pingCommand } from '~/commands/ping';
import { sayCommand } from '~/commands/say';
import { presenceCommand } from '~/commands/presence';
import { bottomCommand } from '~/commands/bottom';
import { uwurandomCommand } from '~/commands/uwurandom';
import { translateCommand } from '~/commands/translate';

import { parseSDMetadata } from '~/sdMetadata';
import { handleChat } from '~/chat';
import { handleCatstareAdd, handleCatstareRemove } from '~/catstareboard';
import { handleButton } from '~/button';

import { server as hapi } from '@hapi/hapi';

import { green, bold, yellow, cyan, dim } from 'kleur/colors';
import { frenAdd, frenRemove } from './commands/fren';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
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
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;

    if (commandName === 'ping') {
      await pingCommand(interaction);
    } else if (commandName === 'say') {
      await sayCommand(interaction);
    } else if (commandName === 'presence') {
      await presenceCommand(interaction);
    } else if (commandName === 'bottom') {
      await bottomCommand(interaction);
    } else if (commandName === 'uwurandom') {
      await uwurandomCommand(interaction);
    } else if (commandName === 'fren') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'add') await frenAdd(interaction);
      else if (sub === 'remove') await frenRemove(interaction);
    }
  } catch (e) {
    console.error(e);

    const errorEmbed = new EmbedBuilder()
      .setTitle('An error occurred!')
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    await handleButton(interaction);
  } catch (e) {
    console.error(e);

    const errorEmbed = new EmbedBuilder()
      .setTitle('An error occurred!')
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isMessageContextMenuCommand()) return;

  try {
    const { commandName } = interaction;

    if (commandName === 'Translate') {
      await translateCommand(interaction);
    }
  } catch (e) {
    console.error(e);

    const errorEmbed = new EmbedBuilder()
      .setTitle('An error occurred!')
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
  try {
    if (e.author.bot) return;
    await parseSDMetadata(e);
  } catch (e) {
    console.error(e);
  }
});

client.on(Events.MessageCreate, async (e) => {
  try {
    if (e.channel.type !== ChannelType.GuildText) return;
    if (e.channel.name !== 'chatbot') return;
    if (e.author.bot && !e.webhookId) return;

    await handleChat(e);
  } catch (e) {
    console.error(e);
  }
});

client.on(Events.MessageReactionAdd, async (e) => {
  try {
    e = await e.fetch();
    if (!e.message.channelId || !e.message.guild) return;
    if (
      !e.message.guild.roles.everyone
        .permissionsIn(e.message.channelId)
        .has(PermissionFlagsBits.ViewChannel)
    )
      return;

    await handleCatstareAdd(e);
  } catch (e) {
    console.error(e);
  }
});

client.on(Events.MessageReactionRemove, async (e) => {
  try {
    e = await e.fetch();
    if (!e.message.channel || !e.message.guild) return;
    if (
      !e.message.guild.roles.everyone
        .permissionsIn(e.message.channelId)
        .has(PermissionFlagsBits.ViewChannel)
    )
      return;

    await handleCatstareRemove(e);
  } catch (e) {
    console.error(e);
  }
});

const startServer = async () => {
  const hs = hapi({ port: process.env.PORT ?? 3000 });

  hs.route({
    method: 'GET',
    path: '/health',
    handler: () => {
      return { ok: true };
    },
  });

  await hs.start();
  console.log(dim(`Started health check server at ${hs.info.uri}.`));
};

client
  .login(process.env.DISCORD_TOKEN)
  .then(startServer)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
