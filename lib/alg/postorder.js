const dfs = require("./dfs");

module.exports = function postorder(g, vs) {
  return dfs(g, vs, "post");
};
