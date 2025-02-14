import { expect } from "chai";

import { Graph } from "../src/graph";
import { read, write } from "../src/json";

function rw(g: Graph) {
  return read(write(g));
}

describe("json", () => {
  it("preserves the graph options", () => {
    expect(rw(new Graph({ directed: true })).isDirected).to.be.true;
    expect(rw(new Graph({ directed: false })).isDirected).to.be.false;
    expect(rw(new Graph({ multigraph: true })).isMultigraph).to.be.true;
    expect(rw(new Graph({ multigraph: false })).isMultigraph).to.be.false;
    expect(rw(new Graph({ compound: true })).isCompound).to.be.true;
    expect(rw(new Graph({ compound: false })).isCompound).to.be.false;
  });

  it("preserves the graph value, if any", () => {
    expect(rw(new Graph().setLabel(1)).label).equals(1);
    expect(rw(new Graph().setLabel({ foo: "bar" })).label).eqls({
      foo: "bar",
    });
    expect(rw(new Graph()).label).to.be.undefined;
  });

  it("preserves nodes", () => {
    expect(rw(new Graph().setNode("a")).hasNode("a")).to.be.true;
    expect(rw(new Graph().setNode("a")).node("a")).to.be.undefined;
    expect(rw(new Graph().setNode("a", 1)).node("a")).equals(1);
    expect(rw(new Graph().setNode("a", { foo: "bar" })).node("a")).eqls({
      foo: "bar",
    });
  });

  it("preserves simple edges", () => {
    expect(rw(new Graph().setEdge("a", "b")).hasEdge("a", "b")).to.be.true;
    expect(rw(new Graph().setEdge("a", "b")).edge("a", "b")).to.be.undefined;
    expect(rw(new Graph().setEdge("a", "b", 1)).edge("a", "b")).equals(1);
    expect(
      rw(new Graph().setEdge("a", "b", { foo: "bar" })).edge("a", "b")
    ).eqls({ foo: "bar" });
  });

  it("preserves multi-edges", () => {
    const g = new Graph({ multigraph: true });

    g.setEdge({ v: "a", w: "b", name: "foo" });
    expect(rw(g).hasEdge("a", "b", "foo")).to.be.true;

    g.setEdge({ v: "a", w: "b", name: "foo" });
    expect(rw(g).edge("a", "b", "foo")).to.be.undefined;

    g.setEdge({ v: "a", w: "b", name: "foo" }, 1);
    expect(rw(g).edge("a", "b", "foo")).equals(1);

    g.setEdge({ v: "a", w: "b", name: "foo" }, { foo: "bar" });
    expect(rw(g).edge("a", "b", "foo")).eqls({ foo: "bar" });
  });

  it("preserves parent / child relationships", () => {
    expect(rw(new Graph({ compound: true }).setNode("a")).parent("a")).to.be
      .undefined;
    expect(
      rw(new Graph({ compound: true }).setParent("a", "parent")).parent("a")
    ).to.equal("parent");
  });
});
