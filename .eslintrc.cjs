module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:unicorn/recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "unicorn"],
	root: true,
	env: { node: true },
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"no-mixed-spaces-and-tabs": "off",
		"unicorn/prevent-abbreviations": "off",
		"unicorn/filename-case": "off",
		"unicorn/no-process-exit": "off",
		"unicorn/number-literal-case": "off",
		"unicorn/numeric-separators-style": "off",
		"unicorn/no-null": "off",
		"unicorn/no-nested-ternary": "off",
	},
};
