const _ = require("lodash");
const { expect } = require("chai");

const { Graph } = require("../../src");
const { findCycles } = require("../../src").alg;

// A helper that sorts components and their contents
function sort(cmpts) {
  return _.sortBy(
    _.map(cmpts, function (cmpt) {
      return _.sortBy(cmpt);
    }),
    function (c) {
      return c[0];
    }
  );
}

describe("alg.findCycles", function () {
  it("returns an empty array for an empty graph", function () {
    expect(findCycles(new Graph())).to.eql([]);
  });

  it("returns an empty array if the graph has no cycles", function () {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    expect(findCycles(g)).to.eql([]);
  });

  it("returns a single entry for a cycle of 1 node", function () {
    const g = new Graph();
    g.setPath(["a", "a"]);
    expect(sort(findCycles(g))).to.eql([["a"]]);
  });

  it("returns a single entry for a cycle of 2 nodes", function () {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    expect(sort(findCycles(g))).to.eql([["a", "b"]]);
  });

  it("returns a single entry for a triangle", function () {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(sort(findCycles(g))).to.eql([["a", "b", "c"]]);
  });

  it("returns multiple entries for multiple cycles", function () {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    g.setPath(["c", "d", "e", "c"]);
    g.setPath(["f", "g", "g"]);
    g.setNode("h");
    expect(sort(findCycles(g))).to.eql([["a", "b"], ["c", "d", "e"], ["g"]]);
  });
});
