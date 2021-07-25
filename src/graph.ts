import DefinedMap from "./defined-map";

const DEFAULT_EDGE_NAME = "\x00";
const GRAPH_NODE = "\x00";
const EDGE_KEY_DELIM = "\x01";

// Types and function docs from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/graphlib/index.d.ts

function incrementOrInitEntry(map: Record<string, number>, k: string): void {
  if (map[k]) {
    map[k] += 1;
  } else {
    map[k] = 1;
  }
}

function decrementOrRemoveEntry(map: Record<string, number>, k: string): void {
  map[k] -= 1;
  if (!map[k]) {
    delete map[k];
  }
}

// TODO: Enforce w/v order Graph option
function edgeArgsToId(
  isDirected: boolean,
  v_: unknown,
  w_: unknown,
  name: unknown
): string {
  let v = v_;
  let w = w_;
  if (!isDirected && (v as string) > (w as string)) {
    [v, w] = [w, v];
  }
  return [v, w, name ?? DEFAULT_EDGE_NAME].join(EDGE_KEY_DELIM);
}

export interface Edge {
  v: unknown;
  w: unknown;
  /** The name that uniquely identifies a multi-edge. */
  name?: unknown;
  value?: string;
}

function edgeArgsToObj(
  isDirected: boolean,
  v_: unknown,
  w_: unknown,
  name: unknown
): Edge {
  let v = v_;
  let w = w_;
  if (!isDirected && (v as string) > (w as string)) {
    [v, w] = [w, v];
  }
  const edgeObj: Edge = { v, w } as { v: unknown; w: unknown };
  if (name) {
    edgeObj.name = name;
  }
  return edgeObj;
}

function edgeObjToId(isDirected: boolean, edgeObj: Edge): string {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}

// Implementation notes:
//
//  * Node id query functions should return string ids for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.
//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
//    reference edges. This is because we need a performant way to look these
//    edges up and, object properties, which have string keys, are the closest
//    we're going to get to a performant hashtable in JavaScript.

interface GraphOptions {
  directed?: boolean; // default: true.
  multigraph?: boolean; // default: false.
  compound?: boolean; // default: false.
}

export default class Graph {
  private _isDirected: boolean;
  private _isMultigraph: boolean;
  private _isCompound: boolean;
  private _label: unknown;
  private _defaultNodeLabelFn: (...args: unknown[]) => unknown;
  private _defaultEdgeLabelFn: (...args: unknown[]) => unknown;
  private _nodes: Map<unknown, unknown>;

  // _parent, _children only valid if _isCompound
  private _parent!: Map<unknown, string>;
  private _children!: DefinedMap<unknown, Set<unknown>>;

  constructor(opts?: GraphOptions) {
    this._isDirected = opts?.directed ?? true;
    this._isMultigraph = opts?.multigraph ?? false;
    this._isCompound = opts?.compound ?? false;

    // Label for the graph itself
    this._label = undefined;

    // Defaults to be set when creating a new node
    this._defaultNodeLabelFn = () => undefined;

    // Defaults to be set when creating a new edge
    this._defaultEdgeLabelFn = () => undefined;

    // v -> label
    this._nodes = new Map<unknown, unknown>();

    if (this._isCompound) {
      // v -> parent
      this._parent = new Map<unknown, string>();

      // v -> children
      this._children = new DefinedMap<unknown, Set<unknown>>();
      this._children.set(GRAPH_NODE, new Set<unknown>());
    }
  }

  // v -> edgeObj
  private _in = new DefinedMap<unknown, Record<string, Edge>>();

  // u -> v -> Number
  private _preds = new DefinedMap<unknown, Record<string, number>>();

  // v -> edgeObj
  private _out = new DefinedMap<unknown, Record<string, Edge>>();

  // v -> w -> Number
  private _sucs = new DefinedMap<unknown, Record<string, number>>();

  // e -> edgeObj
  private _edgeObjs: Record<string, Edge> = {};

  // e -> label
  private _edgeLabels: Record<string, unknown> = {};

  /* Number of nodes in the graph. Should only be changed by the implementation. */
  private _nodeCount = 0;

  /* Number of edges in the graph. Should only be changed by the implementation. */
  private _edgeCount = 0;

  /* === Graph functions ========= */

  /**
   * Whether graph was created with 'directed' flag set to true or not.
   *
   * @returns whether the graph edges have an orientation.
   */
  isDirected(): boolean {
    return this._isDirected;
  }

  /**
   * Whether graph was created with 'multigraph' flag set to true or not.
   *
   * @returns whether the pair of nodes of the graph can have multiple edges.
   */
  isMultigraph(): boolean {
    return this._isMultigraph;
  }

  /**
   * Whether graph was created with 'compound' flag set to true or not.
   *
   * @returns whether a node of the graph can have subnodes.
   */
  isCompound(): boolean {
    return this._isCompound;
  }

  /**
   * Gets the graph label.
   *
   * @returns currently assigned label for the graph or undefined if no label assigned.
   */
  graph(): unknown {
    return this._label;
  }

  /**
   * Sets the label of the graph.
   *
   * @argument label - label value.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setGraph(label: unknown): Graph {
    this._label = label;
    return this;
  }

  /* === Node functions ========== */

  /**
   * Sets the default node label. This label will be assigned as default label
   * in case if no label was specified while setting a node.
   * Complexity: O(1).
   *
   * @argument newDefault - default node label.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setDefaultNodeLabel(
    newDefault: (...args: unknown[]) => unknown | unknown
  ): Graph {
    this._defaultNodeLabelFn =
      typeof newDefault === "function" ? newDefault : () => newDefault;
    return this;
  }

  /**
   * Gets the number of nodes in the graph.
   * Complexity: O(1).
   *
   * @returns nodes count.
   */
  nodeCount(): number {
    return this._nodeCount;
  }

  /**
   * Gets all nodes of the graph. Note, the in case of compound graph subnodes are
   * not included in list.
   * Complexity: O(1).
   *
   * @returns list of graph nodes.
   */
  nodes(): unknown[] {
    return [...this._nodes.keys()];
  }

  /**
   * Gets list of nodes without in-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sources(): unknown[] {
    return this.nodes().filter(v => {
      return !Object.keys(this._in.definedGet(v)).length;
    });
  }

  /**
   * Gets list of nodes without out-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sinks(): unknown[] {
    return this.nodes().filter(v => {
      return !Object.keys(this._out.definedGet(v)).length;
    });
  }

  /**
   * Creates or updates the value for the node v in the graph. If label is supplied
   * it is set as the value for the node. If label is not supplied and the node was
   * created by this call then the default node label will be assigned.
   * Complexity: O(1).
   *
   * @argument name - node name.
   * @argument label - value to set for node.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setNode(v: unknown, value?: unknown): Graph {
    if (this._nodes.has(v)) {
      if (arguments.length > 1) {
        this._nodes.set(v, value);
      }
      return this;
    }

    this._nodes.set(
      v,
      arguments.length > 1 ? value : this._defaultNodeLabelFn(v)
    );
    if (this._isCompound) {
      this._parent.set(v, GRAPH_NODE);
      this._children.set(v, new Set<unknown>());
      this._children.definedGet(GRAPH_NODE).add(v);
    }
    this._in.set(v, {});
    this._preds.set(v, {});
    this._out.set(v, {});
    this._sucs.set(v, {});
    this._nodeCount += 1;
    return this;
  }

  /**
   * Invokes setNode method for each node in names list.
   * Complexity: O(|names|).
   *
   * @argument names - list of nodes names to be set.
   * @argument label - value to set for each node in list.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setNodes(vs: unknown[], value?: unknown): Graph {
    vs.forEach(v => {
      if (arguments.length > 1) {
        this.setNode(v, value);
      } else {
        this.setNode(v);
      }
    });
    return this;
  }

  /**
   * Gets the label of node with specified name.
   * Complexity: O(|V|).
   *
   * @returns label value of the node.
   */
  node(v: unknown): unknown {
    return this._nodes.get(v);
  }

  /**
   * Detects whether graph has a node with specified name or not.
   *
   * @argument name - name of the node.
   * @returns true if graph has node with specified name, false - otherwise.
   */
  hasNode(v: unknown): boolean {
    return this._nodes.has(v);
  }

  /**
   * Remove the node with the name from the graph or do nothing if the node is not in
   * the graph. If the node was removed this function also removes any incident
   * edges.
   * Complexity: O(1).
   *
   * @argument name - name of the node.
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeNode(v: unknown): Graph {
    if (this._nodes.has(v)) {
      const removeEdge = (e: string) => {
        this.removeEdge(this._edgeObjs[e]);
      };
      this._nodes.delete(v);
      if (this._isCompound) {
        this._removeFromParentsChildList(v as string);
        this._parent.delete(v);
        this.children(v as string)?.forEach(child => {
          this.setParent(child as string);
        });
        this._children.delete(v);
      }
      Object.keys(this._in.definedGet(v)).forEach(removeEdge);
      this._in.delete(v);
      this._preds.delete(v);
      Object.keys(this._out.definedGet(v)).forEach(removeEdge);
      this._out.delete(v);
      this._sucs.delete(v);
      this._nodeCount -= 1;
    }
    return this;
  }

  /**
   * Sets node p as a parent for node v if it is defined, or removes the
   * parent for v if p is undefined. Method throws an exception in case of
   * invoking it in context of noncompound graph.
   * Average-case complexity: O(1).
   *
   * @argument v - node to be child for p.
   * @argument p - node to be parent for v.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setParent(v: unknown, parent_?: unknown): Graph {
    if (!this._isCompound) {
      throw new Error("Cannot set parent in a non-compound graph");
    }

    let parent = parent_;
    if (parent === undefined) {
      parent = GRAPH_NODE;
    } else {
      let ancestor = parent;
      while (ancestor !== undefined) {
        if (ancestor === v) {
          throw new Error(
            `Setting ${parent} as parent of ${v} would create a cycle`
          );
        }
        // While loop does the check for undefined
        ancestor = this.parent(ancestor) as string;
      }

      this.setNode(parent);
    }

    this.setNode(v);
    this._removeFromParentsChildList(v);
    this._parent.set(v, parent as string);
    this._children.definedGet(parent).add(v);
    return this;
  }

  private _removeFromParentsChildList(v: unknown): void {
    this._children.definedGet(this._parent.get(v)).delete(v);
  }

  /**
   * Gets parent node for node v.
   * Complexity: O(1).
   *
   * @argument v - node to get parent of.
   * @returns parent node name or void if v has no parent.
   */
  parent(v: unknown): string | void {
    if (this._isCompound) {
      const parent = this._parent.get(v);
      if (parent !== GRAPH_NODE) {
        return parent;
      }
    }
  }

  /**
   * Gets list of direct children of node v.
   * Complexity: O(1).
   *
   * @argument v - node to get children of.
   * @returns children nodes names list.
   */
  children(v_?: unknown): unknown[] | void {
    const v = v_ === undefined ? GRAPH_NODE : v_;

    if (this._isCompound) {
      const children = this._children.get(v);
      if (children) {
        return [...children.values()];
      }
    } else if (v === GRAPH_NODE) {
      return this.nodes();
    } else if (this.hasNode(v)) {
      return [];
    }
  }

  /**
   * Return all nodes that are predecessors of the specified node or undefined if node v is not in
   * the graph. Behavior is undefined for undirected graphs - use neighbors instead.
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  predecessors(v: unknown): string[] | void {
    const predsV = this._preds.get(v);
    if (predsV) {
      return Object.keys(predsV);
    }
  }

  /**
   * Return all nodes that are successors of the specified node or undefined if node v is not in
   * the graph. Behavior is undefined for undirected graphs - use neighbors instead.
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  successors(v: unknown): string[] | void {
    const sucsV = this._sucs.get(v);
    if (sucsV) {
      return Object.keys(sucsV);
    }
  }

  /**
   * Return all nodes that are predecessors or successors of the specified node or undefined if
   * node v is not in the graph.
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  neighbors(v: unknown): string[] | void {
    const neighbors = this.predecessors(v);
    if (neighbors) {
      const uniqueNeighbors = new Set(neighbors);
      for (const s of this.successors(v) ?? []) {
        if (!uniqueNeighbors.has(s)) {
          neighbors.push(s);
          uniqueNeighbors.add(s);
        }
      }
      return neighbors;
    }
  }

  isLeaf(v: unknown): boolean {
    let neighbors;
    if (this.isDirected()) {
      neighbors = this.successors(v);
    } else {
      neighbors = this.neighbors(v);
    }
    return neighbors?.length === 0;
  }

  /**
   * Creates new graph with nodes filtered via filter. Edges incident to rejected node
   * are also removed. In case of compound graph, if parent is rejected by filter,
   * than all its children are rejected too.
   * Average-case complexity: O(|E|+|V|).
   *
   * @argument filter - filtration function detecting whether the node should stay or not.
   * @returns new graph made from current and nodes filtered.
   */
  filterNodes(filter: (v: unknown) => boolean): Graph {
    const copy = new Graph({
      directed: this._isDirected,
      multigraph: this._isMultigraph,
      compound: this._isCompound,
    });

    copy.setGraph(this.graph());

    for (const [v, value] of this._nodes.entries()) {
      if (filter(v as string)) {
        copy.setNode(v, value);
      }
    }

    Object.values(this._edgeObjs).forEach(e => {
      if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
        copy.setEdge(e, this.edge(e));
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const parents: Record<string, string | void> = {};
    function findParent(v: string): string | void {
      const parent = self.parent(v);
      if (parent === undefined || copy.hasNode(parent)) {
        parents[v] = parent;
        return parent;
      } else if (parent in parents) {
        return parents[parent];
      } else {
        return findParent(parent);
      }
    }

    if (this._isCompound) {
      copy.nodes().forEach(v => {
        // void is undefined here, but TS doesn't like that
        copy.setParent(v as string, findParent(v as string) ?? undefined);
      });
    }

    return copy;
  }

  /* === Edge functions ========== */

  /**
   * Sets the default edge label. This label will be assigned as default label
   * in case if no label was specified while setting an edge.
   * Complexity: O(1).
   *
   * @argument label - default edge label.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setDefaultEdgeLabel(
    newDefault: (...args: unknown[]) => unknown | unknown
  ): Graph {
    this._defaultEdgeLabelFn =
      typeof newDefault === "function" ? newDefault : () => newDefault;
    return this;
  }

  /**
   * Gets the number of edges in the graph.
   * Complexity: O(1).
   *
   * @returns edges count.
   */
  edgeCount(): number {
    return this._edgeCount;
  }

  /**
   * Gets edges of the graph. In case of compound graph subgraphs are not considered.
   * Complexity: O(|E|).
   *
   * @return graph edges list.
   */
  edges(): Edge[] {
    return Object.values(this._edgeObjs);
  }

  /**
   * Creates or updates the label for the specified edge. If label is supplied it is
   * set as the value for the edge. If label is not supplied and the edge was created
   * by this call then the default edge label will be assigned. The name parameter is
   * only useful with multigraphs.
   * Complexity: O(1).
   *
   * @argument edge - edge descriptor.
   * @argument value - value to associate with the edge.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setEdge(edge: Edge, value?: unknown): Graph;
  /**
   * Creates or updates the label for the edge (v, w) with the optionally supplied
   * name. If label is supplied it is set as the value for the edge. If label is not
   * supplied and the edge was created by this call then the default edge label will
   * be assigned. The name parameter is only useful with multigraphs.
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument value - value to associate with the edge.
   * @argument name - unique name of the edge in order to identify it in multigraph.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setEdge(v: unknown, w: unknown, value?: unknown, name?: unknown): Graph;
  setEdge(
    edgeOrV: Edge | string,
    valueOrW?: unknown,
    value_?: unknown,
    name_?: unknown
  ): Graph {
    let v;
    let w;
    let name;
    let value;
    let valueSpecified = false;
    const arg0 = edgeOrV;

    if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
      ({ v, w, name } = arg0);
      if (arguments.length === 2) {
        value = valueOrW;
        valueSpecified = true;
      }
    } else {
      v = arg0;
      w = valueOrW;
      name = name_;
      if (arguments.length > 2) {
        value = value_;
        valueSpecified = true;
      }
    }

    const e = edgeArgsToId(this._isDirected, v, w, name);
    if (e in this._edgeLabels) {
      if (valueSpecified) {
        this._edgeLabels[e] = value;
      }
      return this;
    }

    if (name !== undefined && !this._isMultigraph) {
      throw new Error("Cannot set a named edge when isMultigraph = false");
    }

    // It didn't exist, so we need to create it.
    // First ensure the nodes exist.
    this.setNode(v);
    this.setNode(w);

    this._edgeLabels[e] = valueSpecified
      ? value
      : this._defaultEdgeLabelFn(v, w, name);

    const edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
    // Ensure we add undirected edges in a consistent way.
    ({ v, w } = edgeObj);

    Object.freeze(edgeObj);
    this._edgeObjs[e] = edgeObj;
    incrementOrInitEntry(this._preds.definedGet(w), v as string);
    incrementOrInitEntry(this._sucs.definedGet(v), w as string);
    this._in.definedGet(w)[e] = edgeObj;
    this._out.definedGet(v)[e] = edgeObj;
    this._edgeCount += 1;
    return this;
  }

  /**
   * Establish an edges path over the nodes in nodes list. If some edge is already
   * exists, it will update its label, otherwise it will create an edge between pair
   * of nodes with label provided or default label if no label provided.
   * Complexity: O(|nodes|).
   *
   * @argument nodes - list of nodes to be connected in series.
   * @argument label - value to set for each edge between pairs of nodes.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setPath(vs: unknown[], value?: unknown): Graph {
    vs.reduce((v, w) => {
      if (arguments.length > 1) {
        this.setEdge(v, w, value);
      } else {
        this.setEdge(v, w);
      }
      return w;
    });
    return this;
  }

  /**
   * Gets the label for the specified edge.
   * Complexity: O(1).
   *
   * @argument edge - edge descriptor.
   * @returns value associated with specified edge.
   */
  edge(e: Edge): unknown;
  /**
   * Gets the label for the specified edge.
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns value associated with specified edge.
   */
  edge(v: unknown, w: unknown, name?: unknown): unknown;
  edge(edgeOrV: Edge | unknown, w?: unknown, name?: unknown): unknown {
    const e =
      arguments.length === 1
        ? edgeObjToId(this._isDirected, edgeOrV as Edge)
        : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    return this._edgeLabels[e];
  }

  /**
   * Detects whether the graph contains specified edge or not. No subgraphs are considered.
   * Complexity: O(1).
   *
   * @argument edge - edge descriptor.
   * @returns whether the graph contains the specified edge or not.
   */
  hasEdge(e: Edge): boolean;
  /**
   * Detects whether the graph contains specified edge or not. No subgraphs are considered.
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns whether the graph contains the specified edge or not.
   */
  hasEdge(v: unknown, w: unknown, name?: unknown): boolean;
  hasEdge(edgeOrV: Edge | unknown, w?: unknown, name?: unknown): boolean {
    const e =
      arguments.length === 1
        ? edgeObjToId(this._isDirected, edgeOrV as Edge)
        : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    return e in this._edgeLabels;
  }

  /**
   * Removes the specified edge from the graph. No subgraphs are considered.
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeEdge(e: Edge): Graph;
  /**
   * Removes the specified edge from the graph. No subgraphs are considered.
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeEdge(v: unknown, w: unknown, name?: unknown): Graph;
  removeEdge(edgeOrV: Edge | unknown, w?: unknown, name?: unknown): Graph {
    const e =
      arguments.length === 1
        ? edgeObjToId(this._isDirected, edgeOrV as Edge)
        : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    const edge = this._edgeObjs[e];
    if (edge) {
      const { v: v_, w: w_ } = edge;
      delete this._edgeLabels[e];
      delete this._edgeObjs[e];
      decrementOrRemoveEntry(this._preds.definedGet(w_), v_ as string);
      decrementOrRemoveEntry(this._sucs.definedGet(v_), w_ as string);
      delete this._in.definedGet(w_)[e];
      delete this._out.definedGet(v_)[e];
      this._edgeCount -= 1;
    }
    return this;
  }

  /**
   * Return all edges that point to the node v. Optionally filters those edges down to just those
   * coming from node u. Behavior is undefined for undirected graphs - use nodeEdges instead.
   * Complexity: O(|E|).
   *
   * @argument v - edge sink node.
   * @argument w - edge source node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  inEdges(v: unknown, u?: unknown): Edge[] | void {
    const inV = this._in.get(v);
    if (inV) {
      const edges = Object.values(inV);
      if (!u) {
        return edges;
      }
      return edges.filter(edge => edge.v === u);
    }
  }

  /**
   * Return all edges that are pointed at by node v. Optionally filters those edges down to just
   * those point to w. Behavior is undefined for undirected graphs - use nodeEdges instead.
   * Complexity: O(|E|).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  outEdges(v: unknown, w?: unknown): Edge[] | void {
    const outV = this._out.get(v);
    if (outV) {
      const edges = Object.values(outV);
      if (!w) {
        return edges;
      }
      return edges.filter(edge => edge.w === w);
    }
  }

  /**
   * Returns all edges to or from node v regardless of direction. Optionally filters those edges
   * down to just those between nodes v and w regardless of direction.
   * Complexity: O(|E|).
   *
   * @argument v - edge adjacent node.
   * @argument w - edge adjacent node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  nodeEdges(v: unknown, w?: unknown): Edge[] | void {
    const inEdges = this.inEdges(v, w);
    if (inEdges) {
      return inEdges.concat(this.outEdges(v, w) ?? []);
    }
  }
}
