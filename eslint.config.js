import { config } from "@ryanccn/eslint-config";

export default config({
	prettier: false,
	rules: {
		"unicorn/number-literal-case": "off",
		"unicorn/numeric-separators-style": "off",
		"unicorn/no-process-exit": "off",
		"unicorn/import-style": "off",
		"@typescript-eslint/no-misused-promises": "off",
	},
});
