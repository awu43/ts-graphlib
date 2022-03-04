import { expect } from "chai";

import { Graph } from "../../src";
import { tarjan } from "../../src/alg";

// A helper that sorts component contents
function sort(cmpts) {
  return cmpts.map(cmpt => cmpt.sort());
}

describe("alg.tarjan", () => {
  it("returns an empty array for an empty graph", () => {
    expect(tarjan(new Graph())).to.eql([]);
  });

  it("returns singletons for nodes not in a strongly connected component", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    g.setEdge("d", "c");
    expect(sort(tarjan(g))).to.have.deep.members([["a"], ["b"], ["c"], ["d"]]);
  });

  it("returns a single component for a cycle of 1 edge", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    expect(sort(tarjan(g))).to.have.deep.members([["a", "b"]]);
  });

  it("returns a single component for a triangle", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(sort(tarjan(g))).to.have.deep.members([["a", "b", "c"]]);
  });

  it("can find multiple components", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    g.setPath(["c", "d", "e", "c"]);
    g.setNode("f");
    expect(sort(tarjan(g))).to.have.deep.members([
      ["a", "b"],
      ["c", "d", "e"],
      ["f"],
    ]);
  });
});
