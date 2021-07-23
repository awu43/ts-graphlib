const utils = require("../utils");
const dijkstra = require("./dijkstra");

module.exports = function dijkstraAll(g, weightFunc, edgeFunc) {
  return utils.transform(
    g.nodes(),
    function (acc, v) {
      acc[v] = dijkstra(g, v, weightFunc, edgeFunc);
    },
    {}
  );
};
