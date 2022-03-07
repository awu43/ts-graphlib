import { expect } from "chai";

import { dijkstraAll } from "../../src/alg";
import { Graph } from "../../src/graph";

import { allShortestPathsTest } from "./all-shortest-paths.test";
import { edgeWeightFn } from "./edge-weight-fn";

describe("alg.dijkstraAll", () => {
  allShortestPathsTest(dijkstraAll);

  it("throws an Error if it encounters a negative edge weight", () => {
    const g = new Graph();
    g.setEdge("a", "b", 1);
    g.setEdge("a", "c", -2);
    g.setEdge("b", "d", 3);
    g.setEdge("c", "d", 3);

    expect(() => {
      dijkstraAll(g, edgeWeightFn(g));
    }).to.throw();
  });
});
