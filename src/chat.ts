import {
  Colors,
  DiscordAPIError,
  EmbedBuilder,
  type Message,
} from 'discord.js';
import {
  Configuration,
  OpenAIApi,
  type ChatCompletionRequestMessage,
} from 'openai';

import { yellow } from 'kleur/colors';

const SYSTEM_MESSAGE =
  'You are a friendly Discord bot named Blåhaj in a small personal Discord guild called Ryanland. Your developer is Ryan Cao (username RyanCaoDev), the owner of the guild, and you were written in Discord.js. You mainly chat casually with members of the community and often make jokes (nicely). You should use very concise language. Due to the conversational nature of Discord, messages NOT BY YOU will be prefixed with the username or nickname of the author, folloed by a colon. You can treat the username as the name of the author. However, you should not not prefix the messages you send with any username whatsoever.';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_TOKEN,
});

let openai: OpenAIApi | null = null;

if (process.env.OPENAI_TOKEN) {
  openai = new OpenAIApi(configuration);
} else {
  console.warn(yellow('No OPENAI_TOKEN defined, not initializing chatbot'));
}

export const handleChat = async (message: Message) => {
  if (!openai) return;
  if (message.content.startsWith('\\')) return;

  await message.channel.sendTyping();
  const typingTimer = setInterval(() => message.channel.sendTyping(), 5000);

  try {
    const msgs: Message<boolean>[] = [
      ...(
        await message.channel.messages.fetch({
          limit: 15,
          before: message.id,
        })
      ).values(),
    ].reverse();

    msgs.push(message);

    const context = [
      ...msgs.map<ChatCompletionRequestMessage>((msg) => {
        if (msg.author === msg.author.client.user) {
          return { role: 'assistant', content: msg.content };
        }

        return {
          role: 'user',
          content: `${msg.member?.nickname ?? msg.author.username}: ${
            msg.content
          }`,
        };
      }),
    ];

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: SYSTEM_MESSAGE }, ...context],
    });

    let responseMessage = response.data.choices[0].message?.content;
    if (!responseMessage) return;

    if (responseMessage.startsWith('Blåhaj: ')) {
      responseMessage = responseMessage.replace('Blåhaj: ', '');
    }

    const isAppropriate = await openai
      .createModeration({ input: responseMessage })
      .then(({ data }) => !data.results[0].flagged);

    if (isAppropriate) {
      await message.reply({
        content: responseMessage,
        allowedMentions: { parse: ['users'] },
      });
    } else {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Response flagged!')
            .setDescription(
              'The generated response may have been inappropriate.'
            )
            .setColor(Colors.Red),
        ],
      });
    }

    clearInterval(typingTimer);
  } catch (e) {
    clearInterval(typingTimer);

    if (e instanceof DiscordAPIError && e.code === 50035) {
      console.warn(
        yellow(`Unable to reply to message, was probably PluralKit's fault.`)
      );
    } else {
      throw e;
    }
  }
};
