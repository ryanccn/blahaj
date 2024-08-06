import { load } from "js-yaml";
import * as v from "valibot";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const TRIVIA_DATA_PATH = join("src", "features", "trivia", "data");

const TriviaSchema = v.record(v.string(), v.array(v.union([v.string(), v.number()])));
export type TriviaSchema = v.InferOutput<typeof TriviaSchema>;

export const getTriviaNames = async () => {
	return await readdir(TRIVIA_DATA_PATH).then(d =>
		d.filter(f => f.endsWith(".yaml")).map(f => f.replace(/\.yaml$/, ""))
	);
};

export const getTrivia = async (name: string) => {
	const text = await readFile(join(TRIVIA_DATA_PATH, `${name}.yaml`), { encoding: "utf8" });
	const data = v.parse(TriviaSchema, load(text));
	return Object.entries(data).map(([question, answers]) => ({ question, answers: answers.map(a => a.toString()) }));
};
