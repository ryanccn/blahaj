import { EmbedBuilder, type Message } from "discord.js";
// import { defaultLogger } from "~/lib/logger";

const regex = /https?:\/\/github\.com\/([\w-]+\/[\w.-]+)\/blob\/(.+?)\/(.+?)#L(\d+)[~-]?L?(\d*)/g;

export const handleGitHubExpansion = async (message: Message) => {
	const { content } = message;
	if (!regex.test(content)) return;

	let codeBlocks: { language: string; content: string; name: string }[] = [];

	// This is a weird workaround
	content.match(regex);

	for (const match of content.matchAll(regex)) {
		const [fullURL, repo, ref, file, startStr, endStr] = match;

		const start = Number.parseInt(startStr);
		const end = endStr ? Number.parseInt(endStr) : null;
		const name = `${repo}@${ref.length === 40 ? ref.slice(0, 8) : ref} ${file} L${start}${end ? `-${end}` : ""}`;
		const language = new URL(fullURL).pathname.split(".").at(-1) || "";

		const text = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${file}`).then((res) => {
			if (!res.ok) throw new Error(`Failed to fetch ${fullURL} contents`);
			return res.text();
		});
		if (Number.isNaN(start) || Number.isNaN(end)) continue;

		const content = text
			.split("\n")
			.slice(start - 1, end === null ? start : end)
			.join("\n");

		codeBlocks.push({ name, language, content });
	}

	codeBlocks = codeBlocks.filter((block) => !!block.content.trim());

	if (codeBlocks.length > 0) {
		await message.suppressEmbeds(true);
		await message.reply({
			embeds: codeBlocks.map((block) =>
				new EmbedBuilder()
					.setDescription(`\`\`\`${block.language}\n${block.content}\n\`\`\``)
					.setAuthor({ name: block.name })
					.setColor(0xa7f3d0),
			),
			allowedMentions: { repliedUser: false, roles: [], users: [] },
		});
	}
};
