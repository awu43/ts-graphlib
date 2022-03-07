import { expect } from "chai";

import { isAcyclic } from "../../src/alg";
import { Graph } from "../../src/graph";

describe("alg.isAcyclic", () => {
  it("returns true if the graph has no cycles", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    expect(isAcyclic(g)).to.be.true;
  });

  it("returns false if the graph has at least one cycle", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(isAcyclic(g)).to.be.false;
  });

  it("returns false if the graph has a cycle of 1 node", () => {
    const g = new Graph();
    g.setPath(["a", "a"]);
    expect(isAcyclic(g)).to.be.false;
  });

  it("rethrows non-CycleException errors", () => {
    expect(() => {
      isAcyclic(undefined);
    }).to.throw();
  });
});
