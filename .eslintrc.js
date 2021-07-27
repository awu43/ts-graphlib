module.exports = {
  extends: ["./.base-eslint-config.js"],
  overrides: [
    {
      files: ["src/**/*.ts"],
      extends: [
        "./.base-eslint-config.js",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "lines-between-class-members": [
          2,
          "always",
          { exceptAfterSingleLine: true },
        ],
      },
    },
    {
      files: ["test/**/*.test.js"],
      extends: ["./.base-eslint-config.js"],
      rules: {
        "no-unused-expressions": 0,
        "global-require": 0,
      },
    },
  ],
};
