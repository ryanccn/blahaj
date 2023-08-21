import { EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../_types";

import { cpu, currentLoad, mem, osInfo, system } from "systeminformation";
import { keys } from "~/lib/db";

import { formatSize } from "~/lib/utils";

const getCPUInfo = async () => {
	const data = await cpu();
	return `**${data.manufacturer} ${data.brand}** (${data.cores} cores${
		data.efficiencyCores || data.performanceCores
			? `, ${data.efficiencyCores} efficiency, ${data.performanceCores} performance`
			: ""
	})`;
};

const getCPULoadInfo = async () => {
	const data = await currentLoad();
	return `${data.currentLoad.toFixed(1)}%`;
};

const getMemoryInfo = async () => {
	const { active, total } = await mem();

	return `${formatSize(active)}/${formatSize(total)} (${((active / total) * 100).toFixed(2)}%)`;
};

const getHardwareInfo = async () => {
	const data = await system();
	return `${data.manufacturer} **${data.model}**${data.virtual ? " (virtual)" : ""}`;
};

const getOSInfo = async () => {
	const data = await osInfo();
	return `**${data.distro} ${data.kernel}** (${data.arch})`;
};

export const statsCommand: SlashCommand = async (i) => {
	await i.deferReply();

	await i.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle("System stats")
				.addFields({
					name: "CPU",
					value: (await getCPUInfo()) || "*Unknown*",
				})
				.addFields({
					name: "CPU load",
					value: (await getCPULoadInfo()) || "*Unknown*",
				})
				.addFields({
					name: "Memory",
					value: (await getMemoryInfo()) || "*Unknown*",
				})
				.addFields({
					name: "Device",
					value: (await getHardwareInfo()) || "*Unknown*",
				})
				.addFields({
					name: "Operating system",
					value: (await getOSInfo()) || "*Unknown*",
				})
				.addFields({
					name: "KV keys",
					value: (await keys().then((v) => v.toString())) || "*Unknown*",
				})
				.setColor(0xa78bfa),
		],
	});
};
