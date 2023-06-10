import { EmbedBuilder, type Message } from "discord.js";
import { parse } from "exifr";

import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";

import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import { tmpdir } from "node:os";
import { join } from "node:path";

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

const TEMP_DIR = join(tmpdir(), "blahaj-sdmetadata");
const ensureTempDir = async () => {
	await mkdir(TEMP_DIR, { recursive: true });
};

const MAX_PROMPT_LENGTH = 1000;
const truncateString = (str: string) => {
	if (str.length <= MAX_PROMPT_LENGTH) return str;
	return str.slice(0, Math.max(0, MAX_PROMPT_LENGTH - 3)) + "...";
};

export const parseSDMetadata = async (e: Message<boolean>) => {
	await ensureTempDir();

	const pngs = e.attachments.filter((k) => k.contentType === "image/png");
	if (!pngs) return;

	const resultEmbeds: EmbedBuilder[] = [];

	for (const image of pngs.values()) {
		const { body, ok } = await fetch(image.url);
		if (!ok || !body) {
			throw new Error(`Failed to fetch image ${image.url}`);
		}

		const tempPath = join(TEMP_DIR, `${crypto.randomUUID()}.png`);
		await pipeline(
			Readable.fromWeb(body as ReadableStream),
			createWriteStream(tempPath)
		);

		const data = await parse(tempPath, {
			xmp: true,
		});
		await rm(tempPath);

		if (!data) return;

		if (data["sd-metadata"]) {
			const sdMetadata = JSON.parse(data["sd-metadata"]) as SDMetadata;

			resultEmbeds.push(
				new EmbedBuilder()
					.setTitle("Stable Diffusion metadata")
					.setFields(
						{
							name: "Model",
							value: `${sdMetadata.model_weights}${
								sdMetadata.model_hash
									? ` [${sdMetadata.model_hash.slice(0, 8)}]`
									: ""
							}`,
						},
						{
							name: "Prompt",
							value: truncateString(
								typeof sdMetadata.image.prompt === "string"
									? sdMetadata.image.prompt
									: sdMetadata.image.prompt[0].prompt ?? "Unknown"
							),
						},
						{
							name: "Size",
							value: `${sdMetadata.image.width}x${sdMetadata.image.height}`,
							inline: true,
						},
						{
							name: "Seed",
							value: `${sdMetadata.image.seed ?? "Unknown"}`,
							inline: true,
						},
						{
							name: "Sampler",
							value: `${sdMetadata.image.sampler ?? "Unknown"}`,
							inline: true,
						},
						{
							name: "Steps",
							value: `${sdMetadata.image.steps ?? "Unknown"}`,
							inline: true,
						},
						{
							name: "CFG scale",
							value: `${sdMetadata.image.cfg_scale ?? "Unknown"}`,
							inline: true,
						},
						{
							name: "Postprocessing",
							value:
								sdMetadata.image.postprocessing
									?.map(
										(k) =>
											`${k.type}${k.strength ? ` ${k.strength}` : ""}${
												k.scale ? ` ${k.scale}x` : ""
											}`
									)
									.join("\n") || "None detected",
							inline: true,
						}
					)
					.setThumbnail(image.url)
					.setFooter({
						text: `Generated with ${sdMetadata.app_id} ${sdMetadata.app_version}`,
					})
					.setColor(0x38bdf8)
			);
		} else if (data["parameters"]) {
			const parameters = (data.parameters as string)
				.split("\n")
				.filter(Boolean);

			const prompt = parameters[0];
			const negativePrompt = parameters
				.slice(1)
				.find((k) => k.startsWith("Negative prompt:"))
				?.replace("Negative prompt: ", "");

			const options =
				parameters
					.at(-1)
					?.split(", ")
					.map((k) => k.split(": ")) ?? [];

			resultEmbeds.push(
				new EmbedBuilder()
					.setTitle("Stable Diffusion metadata")
					.setFields(
						{
							name: "Prompt",
							value: truncateString(prompt),
						},
						...(negativePrompt
							? [
									{
										name: "Negative prompt",
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
							name: "Extras",
							value: data["extras"] ?? "None detected",
						}
					)
					.setThumbnail(image.url)
					.setFooter({
						text: `Generated with AUTOMATIC1111/stable-diffusion-webui`,
					})
					.setColor(0x38bdf8)
			);
		} else if (
			typeof data.description?.value === "string" &&
			data.description.value.includes("Mochi Diffusion")
		) {
			const mochiDiffusionData: Record<string, string> = {};

			const dataFragments = (data.description.value as string)
				.split("; ")
				.map((k) => k.split(": "));

			for (const [a, ...b] of dataFragments) {
				mochiDiffusionData[a] = b.join(": ");
			}

			resultEmbeds.push(
				new EmbedBuilder()
					.setTitle("Stable Diffusion metadata")
					.setFields(
						{
							name: "Model",
							value: mochiDiffusionData["Model"],
						},
						{
							name: "Prompt",
							value: truncateString(
								mochiDiffusionData["Include in Image"] || "*None*"
							),
						},
						{
							name: "Negative prompt",
							value: truncateString(
								mochiDiffusionData["Exclude from Image"] || "*None*"
							),
						},
						{
							name: "Size",
							value: mochiDiffusionData["Size"],
							inline: true,
						},
						{
							name: "Seed",
							value: mochiDiffusionData["Seed"],
							inline: true,
						},
						{
							name: "Scheduler",
							value: mochiDiffusionData["Scheduler"],
							inline: true,
						},
						{
							name: "Steps",
							value: mochiDiffusionData["Steps"],
							inline: true,
						},
						{
							name: "Guidance Scale",
							value: mochiDiffusionData["Guidance Scale"],
							inline: true,
						},
						{
							name: "Upscaler",
							value: mochiDiffusionData["Upscaler"] || "*None*",
							inline: true,
						}
					)
					.setThumbnail(image.url)
					.setFooter({
						text: `Generated with ${mochiDiffusionData["Generator"]}`,
					})
					.setColor(0x38bdf8)
			);
		}
	}

	if (resultEmbeds.length > 0) await e.reply({ embeds: resultEmbeds });
};
