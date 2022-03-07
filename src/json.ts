import { Graph } from "./graph";
import type { Edge, NodeId, NodeValue, GraphLabel } from "./graph";

// Original types and function docs from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/graphlib/index.d.ts

interface Node {
  v: NodeId;
  value?: NodeValue;
  parent?: NodeId;
}

interface GraphJSON {
  options: {
    directed: boolean;
    multigraph: boolean;
    compound: boolean;
  };
  nodes: Node[];
  edges: Edge[];
  value?: GraphLabel;
}

/**
 * Takes JSON as input and returns the graph representation.
 *
 * @example
 * var g2 = graphlib.json.read(JSON.parse(str));
 * g2.nodes();
 * // ['a', 'b']
 * g2.edges()
 * // [ { v: 'a', w: 'b' } ]
 *
 * @argument json - JSON serializable graph representation
 * @returns graph constructed acccording to specified representation
 */
export function read(json: GraphJSON): Graph {
  const g = new Graph(json.options).setGraph(json.value);
  json.nodes.forEach(entry => {
    g.setNode(entry.v, entry.value);
    if (entry.parent) {
      g.setParent(entry.v, entry.parent);
    }
  });
  json.edges.forEach(entry => {
    g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
  });
  return g;
}

function writeNodes(g: Graph) {
  return g.nodes().map(v => {
    const nodeValue = g.node(v);
    const parent = g.parent(v);
    const node: Node = { v };
    if (nodeValue !== undefined) {
      node.value = nodeValue;
    }
    if (parent !== undefined) {
      node.parent = parent;
    }
    return node;
  });
}

function writeEdges(g: Graph): Edge[] {
  return g.edges().map(e => {
    const edgeValue = g.edge(e);
    const edge: Edge = { v: e.v, w: e.w };
    if (e.name !== undefined) {
      edge.name = e.name;
    }
    if (edgeValue !== undefined) {
      edge.value = edgeValue;
    }
    return edge;
  });
}

/**
 * Creates a JSON representation of the graph that can be serialized to a
 * string with JSON.stringify. The graph can later be restored using json.read.
 *
 * @argument g - target graph to create JSON representation of.
 * @returns JSON serializable graph representation
 */
export function write(g: Graph): GraphJSON {
  const json: GraphJSON = {
    options: {
      directed: g.isDirected(),
      multigraph: g.isMultigraph(),
      compound: g.isCompound(),
    },
    nodes: writeNodes(g),
    edges: writeEdges(g),
  };
  if (g.graph() !== undefined) {
    json.value = JSON.parse(JSON.stringify(g.graph()));
  }
  return json;
}
