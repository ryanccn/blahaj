import { type Message } from 'discord.js';
import { yellow } from 'kleur/colors';
import {
  Configuration,
  OpenAIApi,
  // type ChatCompletionRequestMessage,
} from 'openai';

const SYSTEM_MESSAGE =
  'You are a friendly Discord bot named Blåhaj in a small personal Discord guild called Ryanland. You mainly chat casually with members of the community and often make jokes (nicely).';

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
    const msgs = await message.channel.messages.fetch({ limit: 10 });
    const context = [
      ...msgs
        // @ts-expect-error Discord.js has some messed up types
        .mapValues((msg) => ({
          role: msg.author === msg.author.client.user ? 'assistant' : 'user',
          content: msg.content,
        }))
        .values(),
    ].reverse();

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: SYSTEM_MESSAGE }, ...context],
      max_tokens: 75,
    });

    const responseMessage = response.data.choices[0].message;
    if (!responseMessage) return;

    await message.channel.send(responseMessage.content);
    clearInterval(typingTimer);
  } catch (e) {
    clearInterval(typingTimer);
    throw e;
  }
};
