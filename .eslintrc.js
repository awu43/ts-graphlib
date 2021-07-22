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
