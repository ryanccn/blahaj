import { EmbedBuilder } from 'discord.js';
import type { SlashCommand } from './_types';

import {
  system,
  cpu,
  mem,
  osInfo,
  currentLoad,
  diskLayout,
} from 'systeminformation';
import { formatSize } from '~/lib/utils';

const getCPUInfo = async () => {
  const data = await cpu();
  return `**${data.manufacturer} ${data.brand}** (${data.cores} cores${
    data.efficiencyCores || data.performanceCores
      ? `, ${data.efficiencyCores} efficiency, ${data.performanceCores} performance`
      : ''
  })`;
};

const getCPULoadInfo = async () => {
  const data = await currentLoad();
  return `${data.currentLoad.toFixed(1)}%`;
};

const getMemoryInfo = async () => {
  const { active, total } = await mem();

  return `${formatSize(active)}/${formatSize(total)} (${(
    (active / total) *
    100
  ).toFixed(2)}%)`;
};

const getHardwareInfo = async () => {
  const data = await system();
  return `${data.manufacturer} **${data.model}**${
    data.virtual ? ' (virtual)' : ''
  }`;
};

const getOSInfo = async () => {
  const data = await osInfo();
  return `**${data.distro} ${data.kernel}** (${data.build}) ${data.arch}`;
};

const getDiskInfo = async () => {
  const data = await diskLayout();
  return data
    .map((disk) => `**${disk.name}** ${disk.type}/${disk.interfaceType}`)
    .join('\n');
};

export const statsCommand: SlashCommand = async (i) => {
  await i.deferReply();

  await i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('System stats')
        .addFields({
          name: 'CPU',
          value: await getCPUInfo(),
        })
        .addFields({
          name: 'CPU load',
          value: await getCPULoadInfo(),
        })
        .addFields({
          name: 'Memory',
          value: await getMemoryInfo(),
        })
        .addFields({
          name: 'Device',
          value: await getHardwareInfo(),
        })
        .addFields({
          name: 'Operating system',
          value: await getOSInfo(),
        })
        .addFields({
          name: 'Disks',
          value: await getDiskInfo(),
        })
        .setColor(0xa78bfa),
    ],
  });
};
