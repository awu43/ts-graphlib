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
    "func-names": 0,
    "no-underscore-dangle": 0,
    "no-else-return": 0,
    "consistent-return": 0,
    "no-param-reassign": [2, { props: false }],
    "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
    "no-restricted-syntax": [
      2,
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],
  },
  overrides: [
    {
      files: ["**/*.test.js"],
      rules: {
        "no-unused-expressions": 0,
        "global-require": 0,
      },
    },
  ],
};
