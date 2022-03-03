import { expect } from "chai";
import * as _ from "lodash";

import { Graph, NodeIdError } from "../src";

describe("Graph", () => {
  let g;

  beforeEach(() => {
    g = new Graph();
  });

  describe("initial state", () => {
    it("has no nodes", () => {
      expect(g.nodeCount()).to.equal(0);
    });

    it("has no edges", () => {
      expect(g.edgeCount()).to.equal(0);
    });

    it("has no attributes", () => {
      expect(g.graph()).to.be.undefined;
    });

    it("defaults to a simple directed graph", () => {
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.false;
    });

    it("can be set to undirected", () => {
      g = new Graph({ directed: false });
      expect(g.isDirected()).to.be.false;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.false;
    });

    it("can be set to a compound graph", () => {
      g = new Graph({ compound: true });
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.true;
      expect(g.isMultigraph()).to.be.false;
    });

    it("can be set to a mulitgraph", () => {
      g = new Graph({ multigraph: true });
      expect(g.isDirected()).to.be.true;
      expect(g.isCompound()).to.be.false;
      expect(g.isMultigraph()).to.be.true;
    });
  });

  describe("setGraph", () => {
    it("can be used to get and set properties for the graph", () => {
      g.setGraph("foo");
      expect(g.graph()).to.equal("foo");
    });

    it("is chainable", () => {
      expect(g.setGraph("foo")).to.equal(g);
    });
  });

  describe("nodes", () => {
    it("is empty if there are no nodes in the graph", () => {
      expect(g.nodes()).to.eql([]);
    });

    it("returns the ids of nodes in the graph", () => {
      g.setNode("a");
      g.setNode("b");
      expect(_.sortBy(g.nodes())).to.eql(["a", "b"]);
    });
  });

  describe("sources", () => {
    it("returns nodes in the graph that have no in-edges", () => {
      g.setPath(["a", "b", "c"]);
      g.setNode("d");
      expect(_.sortBy(g.sources())).to.eql(["a", "d"]);
    });
  });

  describe("sinks", () => {
    it("returns nodes in the graph that have no out-edges", () => {
      g.setPath(["a", "b", "c"]);
      g.setNode("d");
      expect(_.sortBy(g.sinks())).to.eql(["c", "d"]);
    });
  });

  describe("filterNodes", () => {
    it("returns an identical graph when the filter selects everything", () => {
      g.setGraph("graph label");
      g.setNode("a", 123);
      g.setPath(["a", "b", "c"]);
      g.setEdge("a", "c", 456);
      const g2 = g.filterNodes(() => true);
      expect(_.sortBy(g2.nodes())).eqls(["a", "b", "c"]);
      expect(_.sortBy(g2.successors("a"))).eqls(["b", "c"]);
      expect(_.sortBy(g2.successors("b"))).eqls(["c"]);
      expect(g2.node("a")).eqls(123);
      expect(g2.edge("a", "c")).eqls(456);
      expect(g2.graph()).eqls("graph label");
    });

    it("returns an empty graph when the filter selects nothing", () => {
      g.setPath(["a", "b", "c"]);
      const g2 = g.filterNodes(() => false);
      expect(g2.nodes()).eqls([]);
      expect(g2.edges()).eqls([]);
    });

    it("only includes nodes for which the filter returns true", () => {
      g.setNodes(["a", "b"]);
      const g2 = g.filterNodes(v => v === "a");
      expect(g2.nodes()).eqls(["a"]);
    });

    it("removes edges that are connected to removed nodes", () => {
      g.setEdge("a", "b");
      const g2 = g.filterNodes(v => v === "a");
      expect(_.sortBy(g2.nodes())).eqls(["a"]);
      expect(g2.edges()).eqls([]);
    });

    it("preserves the directed option", () => {
      g = new Graph({ directed: true });
      expect(g.filterNodes(() => true).isDirected()).to.be.true;

      g = new Graph({ directed: false });
      expect(g.filterNodes(() => true).isDirected()).to.be.false;
    });

    it("preserves the multigraph option", () => {
      g = new Graph({ multigraph: true });
      expect(g.filterNodes(() => true).isMultigraph()).to.be.true;

      g = new Graph({ multigraph: false });
      expect(g.filterNodes(() => true).isMultigraph()).to.be.false;
    });

    it("preserves the compound option", () => {
      g = new Graph({ compound: true });
      expect(g.filterNodes(() => true).isCompound()).to.be.true;

      g = new Graph({ compound: false });
      expect(g.filterNodes(() => true).isCompound()).to.be.false;
    });

    it("includes subgraphs", () => {
      g = new Graph({ compound: true });
      g.setParent("a", "parent");

      const g2 = g.filterNodes(() => true);
      expect(g2.parent("a")).eqls("parent");
    });

    it("includes multi-level subgraphs", () => {
      g = new Graph({ compound: true });
      g.setParent("a", "parent");
      g.setParent("parent", "root");

      const g2 = g.filterNodes(() => true);
      expect(g2.parent("a")).eqls("parent");
      expect(g2.parent("parent")).eqls("root");
    });

    it("promotes a node to a higher subgraph if its parent is not included", () => {
      g = new Graph({ compound: true });
      g.setParent("a", "parent");
      g.setParent("parent", "root");

      const g2 = g.filterNodes(v => v !== "parent");
      expect(g2.parent("a")).eqls("root");
    });
  });

  describe("setNodes", () => {
    it("creates multiple nodes", () => {
      g.setNodes(["a", "b", "c"]);
      expect(g.hasNode("a")).to.be.true;
      expect(g.hasNode("b")).to.be.true;
      expect(g.hasNode("c")).to.be.true;
    });

    it("can set a value for all of the nodes", () => {
      g.setNodes(["a", "b", "c"], "foo");
      expect(g.node("a")).to.equal("foo");
      expect(g.node("b")).to.equal("foo");
      expect(g.node("c")).to.equal("foo");
    });

    it("throws NodeIdError if an ID is undefined or null", () => {
      expect(() => {
        g.setNodes([undefined, "bar"]);
      }).to.throw(NodeIdError);
      expect(() => {
        g.setNodes(["foo", null]);
      }).to.throw(NodeIdError);
    });

    it("is chainable", () => {
      expect(g.setNodes(["a", "b", "c"])).to.equal(g);
    });
  });

  describe("setNode", () => {
    it("throws NodeIdError if ID is undefined or null", () => {
      expect(() => {
        g.setNode(undefined);
      }).to.throw(NodeIdError);
      expect(() => {
        g.setNode(null);
      }).to.throw(NodeIdError);
    });

    it("creates the node if it isn't part of the graph", () => {
      g.setNode("a");
      expect(g.hasNode("a")).to.be.true;
      expect(g.node("a")).to.be.undefined;
      expect(g.nodeCount()).to.equal(1);
    });

    it("can set a value for the node", () => {
      g.setNode("a", "foo");
      expect(g.node("a")).to.equal("foo");
    });

    it("does not change the node's value with a 1-arg invocation", () => {
      g.setNode("a", "foo");
      g.setNode("a");
      expect(g.node("a")).to.equal("foo");
    });

    it("can remove the node's value by passing undefined", () => {
      g.setNode("a", undefined);
      expect(g.node("a")).to.be.undefined;
    });

    it("is idempotent", () => {
      g.setNode("a", "foo");
      g.setNode("a", "foo");
      expect(g.node("a")).to.equal("foo");
      expect(g.nodeCount()).to.equal(1);
    });

    it("is chainable", () => {
      expect(g.setNode("a")).to.equal(g);
    });
  });

  describe("setNodeDefaults", () => {
    it("sets a default label for new nodes", () => {
      g.setDefaultNodeLabel("foo");
      g.setNode("a");
      expect(g.node("a")).to.equal("foo");
    });

    it("does not change existing nodes", () => {
      g.setNode("a");
      g.setDefaultNodeLabel("foo");
      expect(g.node("a")).to.be.undefined;
    });

    it("is not used if an explicit value is set", () => {
      g.setDefaultNodeLabel("foo");
      g.setNode("a", "bar");
      expect(g.node("a")).to.equal("bar");
    });

    it("can take a function", () => {
      g.setDefaultNodeLabel(() => "foo");
      g.setNode("a");
      expect(g.node("a")).to.equal("foo");
    });

    it("can take a function that takes the node's name", () => {
      g.setDefaultNodeLabel(v => `${v}-foo`);
      g.setNode("a");
      expect(g.node("a")).to.equal("a-foo");
    });

    it("is chainable", () => {
      expect(g.setDefaultNodeLabel("foo")).to.equal(g);
    });
  });

  describe("node", () => {
    it("returns undefined if the node isn't part of the graph", () => {
      expect(g.node("a")).to.be.undefined;
    });

    it("returns the value of the node if it is part of the graph", () => {
      g.setNode("a", "foo");
      expect(g.node("a")).to.equal("foo");
    });
  });

  describe("removeNode", () => {
    it("does nothing if the node is not in the graph", () => {
      expect(g.nodeCount()).to.equal(0);
      g.removeNode("a");
      expect(g.hasNode("a")).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it("removes the node if it is in the graph", () => {
      g.setNode("a");
      g.removeNode("a");
      expect(g.hasNode("a")).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it("is idempotent", () => {
      g.setNode("a");
      g.removeNode("a");
      g.removeNode("a");
      expect(g.hasNode("a")).to.be.false;
      expect(g.nodeCount()).to.equal(0);
    });

    it("removes edges incident on the node", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      g.removeNode("b");
      expect(g.edgeCount()).to.equal(0);
    });

    it("removes parent / child relationships for the node", () => {
      g = new Graph({ compound: true });
      g.setParent("c", "b");
      g.setParent("b", "a");
      g.removeNode("b");
      expect(g.parent("b")).to.be.undefined;
      expect(g.children("b")).to.be.undefined;
      expect(g.children("a")).to.not.include("b");
      expect(g.parent("c")).to.be.undefined;
    });

    it("is chainable", () => {
      expect(g.removeNode("a")).to.equal(g);
    });
  });

  describe("setParent", () => {
    beforeEach(() => {
      g = new Graph({ compound: true });
    });

    it("throws if the graph is not compound", () => {
      expect(() => {
        new Graph().setParent("a", "parent");
      }).to.throw();
    });

    it("creates the parent if it does not exist", () => {
      g.setNode("a");
      g.setParent("a", "parent");
      expect(g.hasNode("parent")).to.be.true;
      expect(g.parent("a")).to.equal("parent");
    });

    it("creates the child if it does not exist", () => {
      g.setNode("parent");
      g.setParent("a", "parent");
      expect(g.hasNode("a")).to.be.true;
      expect(g.parent("a")).to.equal("parent");
    });

    it("has the parent as undefined if it has never been invoked", () => {
      g.setNode("a");
      expect(g.parent("a")).to.be.undefined;
    });

    it("moves the node from the previous parent", () => {
      g.setParent("a", "parent");
      g.setParent("a", "parent2");
      expect(g.parent("a")).to.equal("parent2");
      expect(g.children("parent")).to.eql([]);
      expect(g.children("parent2")).to.eql(["a"]);
    });

    it("removes the parent if the parent is undefined", () => {
      g.setParent("a", "parent");
      g.setParent("a", undefined);
      expect(g.parent("a")).to.be.undefined;
      expect(_.sortBy(g.children())).to.eql(["a", "parent"]);
    });

    it("removes the parent if no parent was specified", () => {
      g.setParent("a", "parent");
      g.setParent("a");
      expect(g.parent("a")).to.be.undefined;
      expect(_.sortBy(g.children())).to.eql(["a", "parent"]);
    });

    it("is idempotent to remove a parent", () => {
      g.setParent("a", "parent");
      g.setParent("a");
      g.setParent("a");
      expect(g.parent("a")).to.be.undefined;
      expect(_.sortBy(g.children())).to.eql(["a", "parent"]);
    });

    it("preserves the tree invariant", () => {
      g.setParent("c", "b");
      g.setParent("b", "a");
      expect(() => {
        g.setParent("a", "c");
      }).to.throw();
    });

    it("is chainable", () => {
      expect(g.setParent("a", "parent")).to.equal(g);
    });
  });

  describe("parent", () => {
    beforeEach(() => {
      g = new Graph({ compound: true });
    });

    it("returns undefined if the graph is not compound", () => {
      expect(new Graph({ compound: false }).parent("a")).to.be.undefined;
    });

    it("returns undefined if the node is not in the graph", () => {
      expect(g.parent("a")).to.be.undefined;
    });

    it("defaults to undefined for new nodes", () => {
      g.setNode("a");
      expect(g.parent("a")).to.be.undefined;
    });

    it("returns the current parent assignment", () => {
      g.setNode("a");
      g.setNode("parent");
      g.setParent("a", "parent");
      expect(g.parent("a")).to.equal("parent");
    });
  });

  describe("children", () => {
    beforeEach(() => {
      g = new Graph({ compound: true });
    });

    it("returns undefined if the node is not in the graph", () => {
      expect(g.children("a")).to.be.undefined;
    });

    it("defaults to en empty list for new nodes", () => {
      g.setNode("a");
      expect(g.children("a")).to.eql([]);
    });

    it("returns undefined for a non-compound graph without the node", () => {
      g = new Graph();
      expect(g.children("a")).to.be.undefined;
    });

    it("returns an empty list for a non-compound graph with the node", () => {
      g = new Graph();
      g.setNode("a");
      expect(g.children("a")).eqls([]);
    });

    it("returns all nodes for the root of a non-compound graph", () => {
      g = new Graph();
      g.setNode("a");
      g.setNode("b");
      expect(_.sortBy(g.children())).eqls(["a", "b"]);
    });

    it("returns children for the node", () => {
      g.setParent("a", "parent");
      g.setParent("b", "parent");
      expect(_.sortBy(g.children("parent"))).to.eql(["a", "b"]);
    });

    it("returns all nodes without a parent when the parent is not set", () => {
      g.setNode("a");
      g.setNode("b");
      g.setNode("c");
      g.setNode("parent");
      g.setParent("a", "parent");
      expect(_.sortBy(g.children())).to.eql(["b", "c", "parent"]);
      expect(_.sortBy(g.children(undefined))).to.eql(["b", "c", "parent"]);
    });
  });

  describe("predecessors", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.predecessors("a")).to.be.undefined;
    });

    it("returns the predecessors of a node", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      g.setEdge("a", "a");
      expect(_.sortBy(g.predecessors("a"))).to.eql(["a"]);
      expect(_.sortBy(g.predecessors("b"))).to.eql(["a"]);
      expect(_.sortBy(g.predecessors("c"))).to.eql(["b"]);
    });
  });

  describe("successors", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.successors("a")).to.be.undefined;
    });

    it("returns the successors of a node", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      g.setEdge("a", "a");
      expect(_.sortBy(g.successors("a"))).to.eql(["a", "b"]);
      expect(_.sortBy(g.successors("b"))).to.eql(["c"]);
      expect(_.sortBy(g.successors("c"))).to.eql([]);
    });
  });

  describe("neighbors", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.neighbors("a")).to.be.undefined;
    });

    it("returns the neighbors of a node", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      g.setEdge("a", "a");
      expect(_.sortBy(g.neighbors("a"))).to.eql(["a", "b"]);
      expect(_.sortBy(g.neighbors("b"))).to.eql(["a", "c"]);
      expect(_.sortBy(g.neighbors("c"))).to.eql(["b"]);
    });
  });

  describe("isLeaf", () => {
    it("returns false for connected node in undirected graph", () => {
      g = new Graph({ directed: false });
      g.setNode("a");
      g.setNode("b");
      g.setEdge("a", "b");
      expect(g.isLeaf("b")).to.be.false;
    });
    it("returns true for an unconnected node in undirected graph", () => {
      g = new Graph({ directed: false });
      g.setNode("a");
      expect(g.isLeaf("a")).to.be.true;
    });
    it("returns true for unconnected node in directed graph", () => {
      g.setNode("a");
      expect(g.isLeaf("a")).to.be.true;
    });
    it("returns false for predecessor node in directed graph", () => {
      g.setNode("a");
      g.setNode("b");
      g.setEdge("a", "b");
      expect(g.isLeaf("a")).to.be.false;
    });
    it("returns true for successor node in directed graph", () => {
      g.setNode("a");
      g.setNode("b");
      g.setEdge("a", "b");
      expect(g.isLeaf("b")).to.be.true;
    });
  });

  describe("edges", () => {
    it("is empty if there are no edges in the graph", () => {
      expect(g.edges()).to.eql([]);
    });

    it("returns the keys for edges in the graph", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      expect(_.sortBy(g.edges(), ["v", "w"])).to.eql([
        { v: "a", w: "b" },
        { v: "b", w: "c" },
      ]);
    });
  });

  describe("setPath", () => {
    it("creates a path of mutiple edges", () => {
      g.setPath(["a", "b", "c"]);
      expect(g.hasEdge("a", "b")).to.be.true;
      expect(g.hasEdge("b", "c")).to.be.true;
    });

    it("can set a value for all of the edges", () => {
      g.setPath(["a", "b", "c"], "foo");
      expect(g.edge("a", "b")).to.equal("foo");
      expect(g.edge("b", "c")).to.equal("foo");
    });

    it("is chainable", () => {
      expect(g.setPath(["a", "b", "c"])).to.equal(g);
    });
  });

  describe("setEdge", () => {
    it("creates the edge if it isn't part of the graph", () => {
      g.setNode("a");
      g.setNode("b");
      g.setEdge("a", "b");
      expect(g.edge("a", "b")).to.be.undefined;
      expect(g.hasEdge("a", "b")).to.be.true;
      expect(g.hasEdge({ v: "a", w: "b" })).to.be.true;
      expect(g.edgeCount()).to.equal(1);
    });

    it("creates the nodes for the edge if they are not part of the graph", () => {
      g.setEdge("a", "b");
      expect(g.hasNode("a")).to.be.true;
      expect(g.hasNode("b")).to.be.true;
      expect(g.nodeCount()).to.equal(2);
    });

    it("creates a multi-edge if if it isn't part of the graph", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b", undefined, "name");
      expect(g.hasEdge("a", "b")).to.be.false;
      expect(g.hasEdge("a", "b", "name")).to.be.true;
    });

    it("throws if a multi-edge is used with a non-multigraph", () => {
      expect(() => {
        g.setEdge("a", "b", undefined, "name");
      }).to.throw();
    });

    it("changes the value for an edge if it is already in the graph", () => {
      g.setEdge("a", "b", "foo");
      g.setEdge("a", "b", "bar");
      expect(g.edge("a", "b")).to.equal("bar");
    });

    it("deletes the value for the edge if the value arg is undefined", () => {
      g.setEdge("a", "b", "foo");
      g.setEdge("a", "b", undefined);
      expect(g.edge("a", "b")).to.be.undefined;
      expect(g.hasEdge("a", "b")).to.be.true;
    });

    it("changes the value for a multi-edge if it is already in the graph", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b", "value", "name");
      g.setEdge("a", "b", undefined, "name");
      expect(g.edge("a", "b", "name")).to.be.undefined;
      expect(g.hasEdge("a", "b", "name")).to.be.true;
    });

    it("can take an edge object as the first parameter", () => {
      g.setEdge({ v: "a", w: "b" }, "value");
      expect(g.edge("a", "b")).to.equal("value");
    });

    it("can take an multi-edge object as the first parameter", () => {
      g = new Graph({ multigraph: true });
      g.setEdge({ v: "a", w: "b", name: "name" }, "value");
      expect(g.edge("a", "b", "name")).to.equal("value");
    });

    it("treats edges in opposite directions as distinct in a digraph", () => {
      g.setEdge("a", "b");
      expect(g.hasEdge("a", "b")).to.be.true;
      expect(g.hasEdge("b", "a")).to.be.false;
    });

    it("handles undirected graph edges", () => {
      g = new Graph({ directed: false });
      g.setEdge("a", "b", "foo");
      expect(g.edge("a", "b")).to.equal("foo");
      expect(g.edge("b", "a")).to.equal("foo");
    });

    it("is chainable", () => {
      expect(g.setEdge("a", "b")).to.equal(g);
    });
  });

  describe("setDefaultEdgeLabel", () => {
    it("sets a default label for new edges", () => {
      g.setDefaultEdgeLabel("foo");
      g.setEdge("a", "b");
      expect(g.edge("a", "b")).to.equal("foo");
    });

    it("does not change existing edges", () => {
      g.setEdge("a", "b");
      g.setDefaultEdgeLabel("foo");
      expect(g.edge("a", "b")).to.be.undefined;
    });

    it("is not used if an explicit value is set", () => {
      g.setDefaultEdgeLabel("foo");
      g.setEdge("a", "b", "bar");
      expect(g.edge("a", "b")).to.equal("bar");
    });

    it("can take a function", () => {
      g.setDefaultEdgeLabel(() => "foo");
      g.setEdge("a", "b");
      expect(g.edge("a", "b")).to.equal("foo");
    });

    it("can take a function that takes the edge's endpoints and name", () => {
      g = new Graph({ multigraph: true });
      g.setDefaultEdgeLabel((v, w, name) => `${v}-${w}-${name}-foo`);
      g.setEdge({ v: "a", w: "b", name: "name" });
      expect(g.edge("a", "b", "name")).to.equal("a-b-name-foo");
    });

    it("does not set a default value for a multi-edge that already exists", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b", "old", "name");
      g.setDefaultEdgeLabel(() => {
        return "should not set this";
      });
      g.setEdge({ v: "a", w: "b", name: "name" });
      expect(g.edge("a", "b", "name")).to.equal("old");
    });

    it("is chainable", () => {
      expect(g.setDefaultEdgeLabel("foo")).to.equal(g);
    });
  });

  describe("edge", () => {
    it("returns undefined if the edge isn't part of the graph", () => {
      expect(g.edge("a", "b")).to.be.undefined;
      expect(g.edge({ v: "a", w: "b" })).to.be.undefined;
      expect(g.edge("a", "b", "foo")).to.be.undefined;
    });

    it("returns the value of the edge if it is part of the graph", () => {
      g.setEdge("a", "b", { foo: "bar" });
      expect(g.edge("a", "b")).to.eql({ foo: "bar" });
      expect(g.edge({ v: "a", w: "b" })).to.eql({ foo: "bar" });
      expect(g.edge("b", "a")).to.be.undefined;
    });

    it("returns the value of a multi-edge if it is part of the graph", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b", { bar: "baz" }, "foo");
      expect(g.edge("a", "b", "foo")).to.eql({ bar: "baz" });
      expect(g.edge("a", "b")).to.be.undefined;
    });

    it("returns an edge in either direction in an undirected graph", () => {
      g = new Graph({ directed: false });
      g.setEdge("a", "b", { foo: "bar" });
      expect(g.edge("a", "b")).to.eql({ foo: "bar" });
      expect(g.edge("b", "a")).to.eql({ foo: "bar" });
    });
  });

  describe("removeEdge", () => {
    it("has no effect if the edge is not in the graph", () => {
      g.removeEdge("a", "b");
      expect(g.hasEdge("a", "b")).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it("can remove an edge by edgeObj", () => {
      g = new Graph({ multigraph: true });
      g.setEdge({ v: "a", w: "b", name: "foo" });
      g.removeEdge({ v: "a", w: "b", name: "foo" });
      expect(g.hasEdge("a", "b", "foo")).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it("can remove an edge by separate ids", () => {
      g = new Graph({ multigraph: true });
      g.setEdge({ v: "a", w: "b", name: "foo" });
      g.removeEdge("a", "b", "foo");
      expect(g.hasEdge("a", "b", "foo")).to.be.false;
      expect(g.edgeCount()).to.equal(0);
    });

    it("correctly removes neighbors", () => {
      g.setEdge("a", "b");
      g.removeEdge("a", "b");
      expect(g.successors("a")).to.eql([]);
      expect(g.neighbors("a")).to.eql([]);
      expect(g.predecessors("b")).to.eql([]);
      expect(g.neighbors("b")).to.eql([]);
    });

    it("correctly decrements neighbor counts", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge({ v: "a", w: "b", name: "foo" });
      g.removeEdge("a", "b");
      expect(g.hasEdge("a", "b", "foo"));
      expect(g.successors("a")).to.eql(["b"]);
      expect(g.neighbors("a")).to.eql(["b"]);
      expect(g.predecessors("b")).to.eql(["a"]);
      expect(g.neighbors("b")).to.eql(["a"]);
    });

    it("works with undirected graphs", () => {
      g = new Graph({ directed: false });
      g.setEdge("h", "g");
      g.removeEdge("g", "h");
      expect(g.neighbors("g")).to.eql([]);
      expect(g.neighbors("h")).to.eql([]);
    });

    it("is chainable", () => {
      g.setEdge("a", "b");
      expect(g.removeEdge("a", "b")).to.equal(g);
    });
  });

  describe("inEdges", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.inEdges("a")).to.be.undefined;
    });

    it("returns the edges that point at the specified node", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      expect(g.inEdges("a")).to.eql([]);
      expect(g.inEdges("b")).to.eql([{ v: "a", w: "b" }]);
      expect(g.inEdges("c")).to.eql([{ v: "b", w: "c" }]);
    });

    it("works for multigraphs", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge("a", "b", undefined, "bar");
      g.setEdge("a", "b", undefined, "foo");
      expect(g.inEdges("a")).to.eql([]);
      expect(_.sortBy(g.inEdges("b"), "name")).to.eql([
        { v: "a", w: "b", name: "bar" },
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
    });

    it("can return only edges from a specified node", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge("a", "b", undefined, "foo");
      g.setEdge("a", "c");
      g.setEdge("b", "c");
      g.setEdge("z", "a");
      g.setEdge("z", "b");
      expect(g.inEdges("a", "b")).to.eql([]);
      expect(_.sortBy(g.inEdges("b", "a"), "name")).to.eql([
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
    });
  });

  describe("outEdges", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.outEdges("a")).to.be.undefined;
    });

    it("returns all edges that this node points at", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      expect(g.outEdges("a")).to.eql([{ v: "a", w: "b" }]);
      expect(g.outEdges("b")).to.eql([{ v: "b", w: "c" }]);
      expect(g.outEdges("c")).to.eql([]);
    });

    it("works for multigraphs", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge("a", "b", undefined, "bar");
      g.setEdge("a", "b", undefined, "foo");
      expect(_.sortBy(g.outEdges("a"), "name")).to.eql([
        { v: "a", w: "b", name: "bar" },
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
      expect(g.outEdges("b")).to.eql([]);
    });

    it("can return only edges to a specified node", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge("a", "b", undefined, "foo");
      g.setEdge("a", "c");
      g.setEdge("b", "c");
      g.setEdge("z", "a");
      g.setEdge("z", "b");
      expect(_.sortBy(g.outEdges("a", "b"), "name")).to.eql([
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
      expect(g.outEdges("b", "a")).to.eql([]);
    });
  });

  describe("nodeEdges", () => {
    it("returns undefined for a node that is not in the graph", () => {
      expect(g.nodeEdges("a")).to.be.undefined;
    });

    it("returns all edges that this node points at", () => {
      g.setEdge("a", "b");
      g.setEdge("b", "c");
      expect(g.nodeEdges("a")).to.eql([{ v: "a", w: "b" }]);
      expect(_.sortBy(g.nodeEdges("b"), ["v", "w"])).to.eql([
        { v: "a", w: "b" },
        { v: "b", w: "c" },
      ]);
      expect(g.nodeEdges("c")).to.eql([{ v: "b", w: "c" }]);
    });

    it("works for multigraphs", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge({ v: "a", w: "b", name: "bar" });
      g.setEdge({ v: "a", w: "b", name: "foo" });
      expect(_.sortBy(g.nodeEdges("a"), "name")).to.eql([
        { v: "a", w: "b", name: "bar" },
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
      expect(_.sortBy(g.nodeEdges("b"), "name")).to.eql([
        { v: "a", w: "b", name: "bar" },
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
    });

    it("can return only edges between specific nodes", () => {
      g = new Graph({ multigraph: true });
      g.setEdge("a", "b");
      g.setEdge({ v: "a", w: "b", name: "foo" });
      g.setEdge("a", "c");
      g.setEdge("b", "c");
      g.setEdge("z", "a");
      g.setEdge("z", "b");
      expect(_.sortBy(g.nodeEdges("a", "b"), "name")).to.eql([
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
      expect(_.sortBy(g.nodeEdges("b", "a"), "name")).to.eql([
        { v: "a", w: "b", name: "foo" },
        { v: "a", w: "b" },
      ]);
    });
  });
});
