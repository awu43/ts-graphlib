const utils = require("../utils");

module.exports = function components(g) {
  const visited = {};
  const cmpts = [];
  let cmpt;

  function dfs(v) {
    if (utils.has(visited, v)) return;
    visited[v] = true;
    cmpt.push(v);
    g.successors(v).forEach(dfs);
    g.predecessors(v).forEach(dfs);
  }

  Object.values(g.nodes()).forEach(function (v) {
    cmpt = [];
    dfs(v);
    if (cmpt.length) {
      cmpts.push(cmpt);
    }
  });

  return cmpts;
};
