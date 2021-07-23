const dfs = require("./dfs");

module.exports = function preorder(g, vs) {
  return dfs(g, vs, "pre");
};
