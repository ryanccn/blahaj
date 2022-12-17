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

  const sdMetadata = JSON.parse(data['sd-metadata']) as SDMetadata;
  if (!sdMetadata) return;

  // console.log(sdMetadata);

  await e.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Stable Diffusion metadata')
        .setFields(
          {
            name: 'Model',
            value: sdMetadata.model_weights,
          },
          {
            name: 'Prompt',
            value: sdMetadata.image.prompt![0].prompt,
          },
          {
            name: 'Seed',
            value: `${sdMetadata.image.seed}`,
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
          }
        )
        .setThumbnail(png.url)
        .setFooter({
          text: `Generated with ${sdMetadata.app_id} ${sdMetadata.app_version}`,
        })
        .setColor(0x38bdf8),
    ],
  });
};
