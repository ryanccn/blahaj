import OpenAI from "openai";
import { config } from "~/env";

export let openai: OpenAI | null = null;

if (config.OPENAI_TOKEN) {
	openai = new OpenAI({
		apiKey: config.OPENAI_TOKEN,
	});
}
