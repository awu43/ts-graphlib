import { expect } from "chai";

import { components } from "../../src/alg";
import { Graph } from "../../src/graph";

describe("alg.components", () => {
  it("returns an empty list for an empty graph", () => {
    expect(components(new Graph({ directed: false }))).to.be.empty;
  });

  it("returns singleton lists for unconnected nodes", () => {
    const g = new Graph({ directed: false });
    g.setNode("a");
    g.setNode("b");

    expect(components(g)).to.have.deep.members([["a"], ["b"]]);
  });

  it("returns a list of nodes in a component", () => {
    const g = new Graph({ directed: false });
    g.setEdge("a", "b");
    g.setEdge("b", "c");

    expect(components(g)).to.have.deep.members([["a", "b", "c"]]);
  });

  it("returns nodes connected by a neighbor relationship in a digraph", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    g.setEdge("d", "c");
    g.setEdge("e", "f");

    expect(components(g)).to.have.deep.members([
      ["a", "b", "c", "d"],
      ["e", "f"],
    ]);
  });
});
