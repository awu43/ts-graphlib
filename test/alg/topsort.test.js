import { expect } from "chai";

import { Graph } from "../../src";
import { topsort, CycleException } from "../../src/alg";

describe("alg.topsort", () => {
  it("returns an empty array for an empty graph", () => {
    expect(topsort(new Graph())).to.be.empty;
  });

  it("sorts nodes such that earlier nodes have directed edges to later nodes", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a"]);
    expect(topsort(g)).to.eql(["b", "c", "a"]);
  });

  it("works for a diamond", () => {
    const g = new Graph();
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    const result = topsort(g);
    expect(result.indexOf("a")).to.equal(0);
    expect(result.indexOf("b")).to.be.lt(result.indexOf("d"));
    expect(result.indexOf("c")).to.be.lt(result.indexOf("d"));
    expect(result.indexOf("d")).to.equal(3);
  });

  it("throws CycleException if there is a cycle #1", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    expect(() => {
      topsort(g);
    }).to.throw(CycleException);
  });

  it("throws CycleException if there is a cycle #2", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    g.setEdge("b", "d");
    expect(() => {
      topsort(g);
    }).to.throw(CycleException);
  });

  it("throws CycleException if there is a cycle #3", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    g.setNode("d");
    expect(() => {
      topsort(g);
    }).to.throw(CycleException);
  });
});
