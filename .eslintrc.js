module.exports = {
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 11,
  },
  plugins: ["prettier"],
  rules: {
    "class-methods-use-this": 0,
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
    "import/no-default-export": 2,
    "import/prefer-default-export": 0,
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: { order: "asc" },
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
        "@typescript-eslint/no-inferrable-types": 0,
      },
    },
    {
      files: ["*.test.ts"],
      rules: {
        "no-unused-expressions": 0,

        "@typescript-eslint/no-explicit-any": 0,
      },
    },
  ],
};
