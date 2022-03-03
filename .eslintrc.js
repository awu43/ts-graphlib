module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    "consistent-return": 0,
    "func-names": 0,
    "lines-between-class-members": [
      2,
      "always",
      { exceptAfterSingleLine: true },
    ],
    "max-classes-per-file": 0,
    "no-else-return": 0,
    "no-param-reassign": [2, { props: false }],
    "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
    "no-restricted-syntax": [
      2,
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],
    "no-underscore-dangle": 0,

    "import/extensions": [
      2,
      "never",
      {
        json: "always",
        svg: "always",
      },
    ],
  },
  overrides: [
    {
      files: ["*.ts"],
      settings: {
        "import/resolver": {
          typescript: {},
        },
      },
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "lines-between-class-members": 0,
        "@typescript-eslint/lines-between-class-members": [
          2,
          "always",
          { exceptAfterSingleLine: true },
        ],
      },
    },
    {
      files: ["test/**/*.test.js"],
      rules: {
        "no-unused-expressions": 0,
        "import/no-unresolved": 0,
      },
    },
  ],
};
