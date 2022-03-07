import { expect } from "chai";

import { Graph } from "../../src";
import { dijkstraAll } from "../../src/alg";
import type { Edge } from "../../src/graph";

import { tests as allShortestPathsTest } from "./all-shortest-paths.test";

function weightFn(g: Graph): (e: Edge) => number {
  return edge => g.edge(edge) as number;
}

describe("alg.dijkstraAll", () => {
  allShortestPathsTest(dijkstraAll);

  it("throws an Error if it encounters a negative edge weight", () => {
    const g = new Graph();
    g.setEdge("a", "b", 1);
    g.setEdge("a", "c", -2);
    g.setEdge("b", "d", 3);
    g.setEdge("c", "d", 3);

    expect(() => {
      dijkstraAll(g, weightFn(g));
    }).to.throw();
  });
});
