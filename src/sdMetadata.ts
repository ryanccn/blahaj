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
  model_hash?: string;
  app_id: string;
  app_version: string;
  image: {
    prompt: string | { prompt: string; weight: number }[];
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

const MAX_PROMPT_LENGTH = 1000;
const truncateString = (str: string) => {
  if (str.length <= MAX_PROMPT_LENGTH) return str;
  return str.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
};

export const parseSDMetadata = async (e: Message<boolean>) => {
  const png = e.attachments.find((k) => k.contentType === 'image/png');
  if (!png) return;

  const res = got.stream(png.url);
  res.on('error', (err) => {
    throw err;
  });
  const funnyPath = `${await TEMP_DIR}/${Date.now()}.png`;
  await pipeline(res, createWriteStream(funnyPath));

  const data = await parse(funnyPath, {
    xmp: true,
  });
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
              value: `${sdMetadata.model_weights}${
                sdMetadata.model_hash
                  ? ` [${sdMetadata.model_hash.substring(0, 8)}]`
                  : ''
              }`,
            },
            {
              name: 'Prompt',
              value: truncateString(
                typeof sdMetadata.image.prompt === 'string'
                  ? sdMetadata.image.prompt
                  : sdMetadata.image.prompt[0].prompt ?? 'Unknown'
              ),
            },
            {
              name: 'Size',
              value: `${sdMetadata.image.width}x${sdMetadata.image.height}`,
              inline: true,
            },
            {
              name: 'Seed',
              value: `${sdMetadata.image.seed ?? 'Unknown'}`,
              inline: true,
            },
            {
              name: 'Sampler',
              value: `${sdMetadata.image.sampler ?? 'Unknown'}`,
              inline: true,
            },
            {
              name: 'Steps',
              value: `${sdMetadata.image.steps ?? 'Unknown'}`,
              inline: true,
            },
            {
              name: 'CFG scale',
              value: `${sdMetadata.image.cfg_scale ?? 'Unknown'}`,
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
                  .join('\n') || 'None detected',
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
      .filter((k) => k.startsWith('Negative prompt:'))[0]
      ?.replace('Negative prompt: ', '');

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
              value: truncateString(prompt),
            },
            ...(negativePrompt
              ? [
                  {
                    name: 'Negative prompt',
                    value: truncateString(negativePrompt),
                  },
                ]
              : []),
            ...options.map((opt) => ({
              name: opt[0],
              value: opt[1],
              inline: true,
            })),
            {
              name: 'Extras',
              value: data['extras'] ?? 'None detected',
            }
          )
          .setThumbnail(png.url)
          .setFooter({
            text: `Generated with AUTOMATIC1111/stable-diffusion-webui`,
          })
          .setColor(0x38bdf8),
      ],
    });
  } else if (
    typeof data.description?.value === 'string' &&
    data.description.value.includes('Mochi Diffusion')
  ) {
    const mochiDiffusionData: Record<string, string> = {};

    (data.description.value as string)
      .split('; ')
      .map((k) => k.split(': '))
      .forEach(([a, ...b]) => {
        mochiDiffusionData[a] = b.join(': ');
      });

    await e.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Stable Diffusion metadata')
          .setFields(
            {
              name: 'Model',
              value: mochiDiffusionData['Model'],
            },
            {
              name: 'Prompt',
              value: truncateString(
                mochiDiffusionData['Include in Image'] || '*None*'
              ),
            },
            {
              name: 'Negative prompt',
              value: truncateString(
                mochiDiffusionData['Exclude from Image'] || '*None*'
              ),
            },
            {
              name: 'Size',
              value: mochiDiffusionData['Size'],
              inline: true,
            },
            {
              name: 'Seed',
              value: mochiDiffusionData['Seed'],
              inline: true,
            },
            {
              name: 'Scheduler',
              value: mochiDiffusionData['Scheduler'],
              inline: true,
            },
            {
              name: 'Steps',
              value: mochiDiffusionData['Steps'],
              inline: true,
            },
            {
              name: 'Guidance Scale',
              value: mochiDiffusionData['Guidance Scale'],
              inline: true,
            },
            {
              name: 'Upscaler',
              value: mochiDiffusionData['Upscaler'] || '*None*',
              inline: true,
            }
          )
          .setThumbnail(png.url)
          .setFooter({
            text: `Generated with ${mochiDiffusionData['Generator']}`,
          })
          .setColor(0x38bdf8),
      ],
    });
  }
};
