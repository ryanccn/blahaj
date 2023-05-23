module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	root: true,
	env: { node: true },
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"no-mixed-spaces-and-tabs": "off",
	},
};
