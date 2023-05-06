import { EmbedBuilder } from 'discord.js';
import { magenta } from 'kleur/colors';
import type { SlashCommand } from './_types';

const LOG_PREFIX = magenta('[Stable Diffusion] ');

const startURL = new URL(
  '/start',
  process.env.STABLE_DIFFUSION_API_URL
).toString();
const getStatusURL = (callId: string) =>
  new URL(`/status/${callId}`, process.env.STABLE_DIFFUSION_API_URL).toString();

interface StableDiffusionAPIResponse {
  status: 'done';
  data: {
    url: string;
    prompt: string;
    negative_prompt: string;
    seed: number;
    steps: number;
    scheduler: string;
    upscaled: boolean;
  };
}

export const stableDiffusionCommand: SlashCommand = async (i) => {
  if (
    !process.env.STABLE_DIFFUSION_API_URL ||
    !process.env.STABLE_DIFFUSION_API_TOKEN
  ) {
    await i.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Stable Diffusion not configured!')
          .setDescription(
            'The environment variable `STABLE_DIFFUSION_API_URL` is not set.'
          )
          .setColor(0xfacc15),
      ],
    });
    return;
  }

  const prompt = i.options.getString('prompt', true);
  const negativePrompt = i.options.getString('negative-prompt');
  const seed = i.options.getInteger('seed');
  const upscale = i.options.getBoolean('upscale') ?? false;

  await i.deferReply();

  const { call_id: callId } = await fetch(startURL, {
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      seed,
      upscale,
    }),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }).then((res) => {
    if (!res.ok) throw new Error('Starting Stable Diffusion task failed!');
    return res.json() as Promise<{ call_id: string }>;
  });

  console.log(LOG_PREFIX + `Dispatched ${callId}`);

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Working...')
        .setDescription(
          'Your image is being generated!\n' +
            `Estimated to be done <t:${Math.floor(Date.now() / 1000) + 40}:R>`
        )
        .setColor(0x2dd4bf),
    ],
  });

  for (let _ = 1; _ <= 60; _++) {
    console.log(LOG_PREFIX + `Polling ${callId} (try ${_}/60)`);
    const statusResp = await fetch(getStatusURL(callId), {
      headers: {
        Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_TOKEN}`,
      },
    });

    if (statusResp.status === 202) {
      await new Promise<void>((resolve) => setTimeout(resolve, 5000));
      continue;
    } else if (statusResp.status === 200) {
      const { data } = (await statusResp.json()) as StableDiffusionAPIResponse;

      console.log(LOG_PREFIX + `Received success response from ${callId}`);

      await i.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Stable Diffusion generation')
            .addFields({ name: 'Prompt', value: data.prompt })
            .addFields({
              name: 'Negative prompt',
              value: data.negative_prompt ?? '*None*',
            })
            .addFields({
              name: 'Seed',
              value: data.seed.toString(),
            })
            .addFields({
              name: 'Steps',
              value: data.steps.toString(),
            })
            .addFields({
              name: 'Scheduler',
              value: data.scheduler,
            })
            .addFields({
              name: 'Upscaled',
              value: data.upscaled ? 'Yes' : 'No',
            })
            .setThumbnail(data.url)
            .setURL(data.url)
            .setTimestamp(Date.now())
            .setColor(0x2dd4bf),
        ],
      });
      return;
    } else {
      throw new Error(
        `Stable Diffusion API received unexpected response: ${statusResp.status} ${statusResp.statusText}`
      );
    }
  }

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Timed out!')
        .setDescription('Something unexpected must have happened :(')
        .setColor(0xef4444),
    ],
  });
};
