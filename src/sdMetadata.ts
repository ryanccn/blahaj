import { EmbedBuilder, type Message } from 'discord.js';
import { parse } from 'exifr';
import got from 'got';

import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { mkdtemp, rm } from 'fs/promises';

import { tmpdir } from 'os';
import { join } from 'path';

interface SDMetadata {
  model: string;
  model_weights: string;
  model_hash: string;
  app_id: string;
  app_version: string;
  image: {
    prompt?: {
      prompt: string;
      weight: number;
    }[];
    steps?: number;
    cfg_scale?: number;
    threshold?: number;
    perlin?: number;
    height?: number;
    width?: number;
    seed?: number;
    seamless?: boolean;
    hires_fix?: boolean;
    type?: string;
    postprocessing?: { type: string; scale?: number; strength?: number }[];
    sampler?: string;
    variations?: [];
  };
}

const TEMP_DIR = mkdtemp(join(tmpdir(), 'blahaj-'));

export const parseSDMetadata = async (e: Message<boolean>) => {
  const png = e.attachments.find((k) => k.contentType === 'image/png');
  if (!png) return;

  const res = got.stream(png.url);
  res.on('error', (err) => {
    throw err;
  });
  const funnyPath = `${await TEMP_DIR}/${Date.now()}.png`;
  await pipeline(res, createWriteStream(funnyPath));

  const data = await parse(funnyPath);
  await rm(funnyPath);

  if (!data) return;

  if (data['sd-metadata']) {
    const sdMetadata = JSON.parse(data['sd-metadata']) as SDMetadata;

    await e.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Stable Diffusion metadata')
          .setFields(
            {
              name: 'Model',
              value: `${sdMetadata.model_weights} [${sdMetadata.model_hash}]`,
            },
            {
              name: 'Prompt',
              value: sdMetadata.image.prompt![0].prompt,
            },
            {
              name: 'Size',
              value: `${sdMetadata.image.width}x${sdMetadata.image.height}`,
              inline: true,
            },
            {
              name: 'Seed',
              value: `${sdMetadata.image.seed}`,
              inline: true,
            },
            {
              name: 'Sampler',
              value: `${sdMetadata.image.sampler}`,
              inline: true,
            },
            {
              name: 'Steps',
              value: `${sdMetadata.image.steps}`,
              inline: true,
            },
            {
              name: 'CFG scale',
              value: `${sdMetadata.image.cfg_scale}`,
              inline: true,
            },
            {
              name: 'Postprocessing',
              value:
                sdMetadata.image.postprocessing
                  ?.map(
                    (k) =>
                      `${k.type}${k.strength ? ` ${k.strength}` : ''}${
                        k.scale ? ` ${k.scale}x` : ''
                      }`
                  )
                  .join('\n') ?? 'None detected',
              inline: true,
            }
          )
          .setThumbnail(png.url)
          .setFooter({
            text: `Generated with ${sdMetadata.app_id} ${sdMetadata.app_version}`,
          })
          .setColor(0x38bdf8),
      ],
    });
  } else if (data['parameters']) {
    const parameters = (data.parameters as string).split('\n').filter(Boolean);

    const prompt = parameters[0];
    const negativePrompt = parameters
      .slice(1)
      .filter((k) => k.startsWith('Negative prompt:'))[0];
    const options = parameters[parameters.length - 1]
      .split(', ')
      .map((k) => k.split(': '));

    await e.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Stable Diffusion metadata')
          .setFields(
            {
              name: 'Prompt',
              value: prompt,
            },
            ...(negativePrompt
              ? [
                  {
                    name: 'Negative prompt',
                    value: negativePrompt,
                  },
                ]
              : []),
            {
              name: 'Extras',
              value: data['extras'] ?? 'None detected',
            },
            ...options.map((opt) => ({
              name: opt[0],
              value: opt[1],
              inline: true,
            }))
          )
          .setThumbnail(png.url)
          .setFooter({
            text: `Generated with A1111`,
          })
          .setColor(0x38bdf8),
      ],
    });
  }
};
