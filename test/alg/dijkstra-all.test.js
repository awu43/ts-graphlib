import { expect } from "chai";

import Graph, { alg } from "../../src";
import allShortestPathsTest from "./all-shortest-paths.test";

const { dijkstraAll } = alg;

function weight(g) {
  return function (e) {
    return g.edge(e);
  };
}

describe("alg.dijkstraAll", function () {
  allShortestPathsTest(dijkstraAll);

  it("throws an Error if it encounters a negative edge weight", function () {
    const g = new Graph();
    g.setEdge("a", "b", 1);
    g.setEdge("a", "c", -2);
    g.setEdge("b", "d", 3);
    g.setEdge("c", "d", 3);

    expect(function () {
      dijkstraAll(g, weight(g));
    }).to.throw();
  });
});
