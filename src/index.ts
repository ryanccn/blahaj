import {
  Client,
  GatewayIntentBits,
  Partials,
  OAuth2Scopes,
  ActivityType,
  EmbedBuilder,
  PermissionFlagsBits,
  Events,
} from 'discord.js';

import { pingCommand } from '~/commands/ping';
import { sayCommand } from '~/commands/say';
import { presenceCommand } from '~/commands/presence';
import { getHajEmoji } from '~/utils';

import { green, bold, yellow, cyan } from 'kleur/colors';
import 'dotenv/config';

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

  client.user!.setPresence({
    activities: [{ type: ActivityType.Playing, name: 'IKEA' }],
  });

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
      }
    } catch {
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

client.login(process.env.DISCORD_TOKEN).catch((e) => {
  console.error(e);
  process.exit(1);
});
