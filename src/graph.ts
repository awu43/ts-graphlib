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

function edgeArgsToId(
  isDirected: boolean,
  v_: unknown,
  w_: unknown,
  name: string | undefined
): string {
  let v = String(v_);
  let w = String(w_);
  if (!isDirected && v > w) {
    [v, w] = [w, v];
  }
  return [v, w, name ?? DEFAULT_EDGE_NAME].join(EDGE_KEY_DELIM);
}

export interface Edge {
  v: string;
  w: string;
  /** The name that uniquely identifies a multi-edge. */
  name?: string | undefined;
  value?: string;
}

function edgeArgsToObj(
  isDirected: boolean,
  v_: unknown,
  w_: unknown,
  name: string | undefined
) {
  let v = String(v_);
  let w = String(w_);
  if (!isDirected && v > w) {
    [v, w] = [w, v];
  }
  const edgeObj: Edge = { v, w };
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
  private _nodes: Record<string, unknown>;

  // _parent, _children only valid if _isCompound
  private _parent!: Record<string, string>;
  private _children!: Record<string, Record<string, boolean>>;

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
    this._nodes = {};

    if (this._isCompound) {
      // v -> parent
      this._parent = {};

      // v -> children
      this._children = {};
      this._children[GRAPH_NODE] = {};
    }
  }

  // v -> edgeObj
  private _in: Record<string, Record<string, Edge>> = {};

  // u -> v -> Number
  private _preds: Record<string, Record<string, number>> = {};

  // v -> edgeObj
  private _out: Record<string, Record<string, Edge>> = {};

  // v -> w -> Number
  private _sucs: Record<string, Record<string, number>> = {};

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
  nodes(): string[] {
    return Object.keys(this._nodes);
  }

  /**
   * Gets list of nodes without in-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sources(): string[] {
    return this.nodes().filter(v => {
      return !Object.keys(this._in[v]).length;
    });
  }

  /**
   * Gets list of nodes without out-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sinks(): string[] {
    return this.nodes().filter(v => {
      return !Object.keys(this._out[v]).length;
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
  setNode(v: string, value?: unknown): Graph {
    if (v in this._nodes) {
      if (arguments.length > 1) {
        this._nodes[v] = value;
      }
      return this;
    }

    this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v);
    if (this._isCompound) {
      this._parent[v] = GRAPH_NODE;
      this._children[v] = {};
      this._children[GRAPH_NODE][v] = true;
    }
    this._in[v] = {};
    this._preds[v] = {};
    this._out[v] = {};
    this._sucs[v] = {};
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
  setNodes(vs: string[], value?: unknown): Graph {
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
  node(v: string): unknown {
    return this._nodes[v];
  }

  /**
   * Detects whether graph has a node with specified name or not.
   *
   * @argument name - name of the node.
   * @returns true if graph has node with specified name, false - otherwise.
   */
  hasNode(v: string): boolean {
    return v in this._nodes;
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
  removeNode(v: string): Graph {
    if (v in this._nodes) {
      const removeEdge = (e: string) => {
        this.removeEdge(this._edgeObjs[e]);
      };
      delete this._nodes[v];
      if (this._isCompound) {
        this._removeFromParentsChildList(v);
        delete this._parent[v];
        this.children(v)?.forEach(child => {
          this.setParent(child);
        });
        delete this._children[v];
      }
      Object.keys(this._in[v]).forEach(removeEdge);
      delete this._in[v];
      delete this._preds[v];
      Object.keys(this._out[v]).forEach(removeEdge);
      delete this._out[v];
      delete this._sucs[v];
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
  setParent(v: string, parent_?: string): Graph {
    if (!this._isCompound) {
      throw new Error("Cannot set parent in a non-compound graph");
    }

    let parent = parent_;
    if (parent === undefined) {
      parent = GRAPH_NODE;
    } else {
      // Coerce parent to string
      parent = String(parent);

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
    this._parent[v] = parent;
    this._children[parent][v] = true;
    return this;
  }

  private _removeFromParentsChildList(v: string): void {
    delete this._children[this._parent[v]][v];
  }

  /**
   * Gets parent node for node v.
   * Complexity: O(1).
   *
   * @argument v - node to get parent of.
   * @returns parent node name or void if v has no parent.
   */
  parent(v: string): string | void {
    if (this._isCompound) {
      const parent = this._parent[v];
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
  children(v_?: string): string[] | void {
    const v = v_ === undefined ? GRAPH_NODE : v_;

    if (this._isCompound) {
      const children = this._children[v];
      if (children) {
        return Object.keys(children);
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
  predecessors(v: string): string[] | void {
    const predsV = this._preds[v];
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
  successors(v: string): string[] | void {
    const sucsV = this._sucs[v];
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
  neighbors(v: string): string[] | void {
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

  isLeaf(v: string): boolean {
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
  filterNodes(filter: (v: string) => boolean): Graph {
    const copy = new Graph({
      directed: this._isDirected,
      multigraph: this._isMultigraph,
      compound: this._isCompound,
    });

    copy.setGraph(this.graph());

    Object.entries(this._nodes).forEach(([v, value]) => {
      if (filter(v)) {
        copy.setNode(v, value);
      }
    });

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
        copy.setParent(v, findParent(v) ?? undefined);
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
   * Establish an edges path over the nodes in nodes list. If some edge is already
   * exists, it will update its label, otherwise it will create an edge between pair
   * of nodes with label provided or default label if no label provided.
   * Complexity: O(|nodes|).
   *
   * @argument nodes - list of nodes to be connected in series.
   * @argument label - value to set for each edge between pairs of nodes.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setPath(vs: string[], value?: unknown): Graph {
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
  setEdge(v: string, w: string, value?: unknown, name?: string): Graph;
  setEdge(
    edgeOrV: Edge | string,
    valueOrW?: unknown,
    value_?: unknown,
    name_?: string
  ): Graph {
    let v;
    let w;
    let name;
    let value;
    let valueSpecified = false;
    const arg0 = edgeOrV;

    if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
      v = arg0.v;
      w = arg0.w;
      name = arg0.name;
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

    v = String(v);
    w = String(w);
    if (name !== undefined) {
      name = String(name);
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
    v = edgeObj.v;
    w = edgeObj.w;

    Object.freeze(edgeObj);
    this._edgeObjs[e] = edgeObj;
    incrementOrInitEntry(this._preds[w], v);
    incrementOrInitEntry(this._sucs[v], w);
    this._in[w][e] = edgeObj;
    this._out[v][e] = edgeObj;
    this._edgeCount += 1;
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
  edge(v: string, w: string, name?: string): unknown;
  edge(edgeOrV: Edge | string, w?: string, name?: string): unknown {
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
  hasEdge(v: string, w: string, name?: string): boolean;
  hasEdge(edgeOrV: Edge | string, w?: string, name?: string): boolean {
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
  removeEdge(v: string, w: string, name?: string): Graph;
  removeEdge(edgeOrV: Edge | string, w?: string, name?: string): Graph {
    const e =
      arguments.length === 1
        ? edgeObjToId(this._isDirected, edgeOrV as Edge)
        : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    const edge = this._edgeObjs[e];
    if (edge) {
      const { v: v_, w: w_ } = edge;
      delete this._edgeLabels[e];
      delete this._edgeObjs[e];
      decrementOrRemoveEntry(this._preds[w_], v_);
      decrementOrRemoveEntry(this._sucs[v_], w_);
      delete this._in[w_][e];
      delete this._out[v_][e];
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
  inEdges(v: string, u?: string): Edge[] | void {
    const inV = this._in[v];
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
  outEdges(v: string, w?: string): Edge[] | void {
    const outV = this._out[v];
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
  nodeEdges(v: string, w?: string): Edge[] | void {
    const inEdges = this.inEdges(v, w);
    if (inEdges) {
      return inEdges.concat(this.outEdges(v, w) ?? []);
    }
  }
}
