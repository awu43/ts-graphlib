import { expect } from "chai";

import { tarjan } from "../../src/alg";
import { Graph } from "../../src/graph";

import { sortComponents } from "./utils";

describe("alg.tarjan", () => {
  it("returns an empty array for an empty graph", () => {
    expect(tarjan(new Graph())).to.eql([]);
  });

  it("returns singletons for nodes not in a strongly connected component", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    g.setEdge("d", "c");
    expect(sortComponents(tarjan(g))).to.have.deep.members([
      ["a"],
      ["b"],
      ["c"],
      ["d"],
    ]);
  });

  it("returns a single component for a cycle of 1 edge", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    expect(sortComponents(tarjan(g))).to.have.deep.members([["a", "b"]]);
  });

  it("returns a single component for a triangle", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(sortComponents(tarjan(g))).to.have.deep.members([["a", "b", "c"]]);
  });

  it("can find multiple components", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    g.setPath(["c", "d", "e", "c"]);
    g.setNode("f");
    expect(sortComponents(tarjan(g))).to.have.deep.members([
      ["a", "b"],
      ["c", "d", "e"],
      ["f"],
    ]);
  });
});
