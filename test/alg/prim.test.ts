import { expect } from "chai";

import { Graph } from "../../src";
import { prim } from "../../src/alg";
import type { Edge } from "../../src/graph";

function weightFn(g: Graph): (e: Edge) => number {
  return edge => g.edge(edge) as number;
}

describe("alg.prim", () => {
  it("returns an empty graph for an empty input", () => {
    const source = new Graph();

    const g = prim(source, weightFn(source));
    expect(g.nodeCount()).to.equal(0);
    expect(g.edgeCount()).to.equal(0);
  });

  it("returns a single node graph for a graph with a single node", () => {
    const source = new Graph();
    source.setNode("a");

    const g = prim(source, weightFn(source));
    expect(g.nodes()).to.eql(["a"]);
    expect(g.edgeCount()).to.equal(0);
  });

  it("returns a deterministic result given an optimal solution", () => {
    const source = new Graph();
    source.setEdge("a", "b", 1);
    source.setEdge("b", "c", 2);
    source.setEdge("b", "d", 3);
    // This edge should not be in the min spanning tree
    source.setEdge("c", "d", 20);
    // This edge should not be in the min spanning tree
    source.setEdge("c", "e", 60);
    source.setEdge("d", "e", 1);

    const g = prim(source, weightFn(source));
    expect(g.neighbors("a")).to.eql(["b"]);
    expect(g.neighbors("b")).to.have.members(["a", "c", "d"]);
    expect(g.neighbors("c")).to.eql(["b"]);
    expect(g.neighbors("d")).to.have.members(["b", "e"]);
    expect(g.neighbors("e")).to.eql(["d"]);
  });

  it("throws an Error for unconnected graphs", () => {
    const source = new Graph();
    source.setNode("a");
    source.setNode("b");

    expect(() => {
      prim(source, weightFn(source));
    }).to.throw();
  });
});
