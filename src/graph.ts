import { DefinedMap } from "./defined-map";

const DEFAULT_EDGE_NAME = "\x00";
const GRAPH_NODE = "\x00";
const EDGE_KEY_DELIM = "\x01";

// Original types and function docs from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/graphlib/index.d.ts

export type GraphLabel = unknown;

export type NodeId = unknown;
export type NodeValue = unknown;
type NodeLabel = unknown;

type EdgeId = string;
type EdgeLabel = unknown;
type EdgeValue = unknown;
type EdgeName = unknown;

type FactoryFunc<V> = (...args: unknown[]) => V;

export class NodeIdError extends Error {}

function incrementOrInitEntry<K = unknown>(map: Map<K, number>, k: K): void {
  const entry = map.get(k);
  if (entry) {
    map.set(k, entry + 1);
  } else {
    map.set(k, 1);
  }
}

function decrementOrRemoveEntry<K = unknown>(map: Map<K, number>, k: K): void {
  map.set(k, (map.get(k) as number) - 1);
  if (!map.get(k)) {
    map.delete(k);
  }
}

export interface Edge {
  v: NodeId;
  w: NodeId;
  /** The name that uniquely identifies a multi-edge. */
  name?: EdgeName;
  value?: EdgeValue;
}

function isEdge(edge: unknown): edge is Edge {
  return !!(
    edge &&
    typeof edge === "object" &&
    // @ts-expect-error: Might not exist
    typeof edge.v === "string" &&
    // @ts-expect-error: Might not exist
    typeof edge.w === "string"
  );
}

function edgeArgsToId(
  isDirected: boolean,
  v_: NodeId,
  w_: NodeId,
  name?: EdgeName
): EdgeId {
  let v = v_;
  let w = w_;
  if (!isDirected && (v as string) > (w as string)) {
    [v, w] = [w, v];
  }
  return [v, w, name ?? DEFAULT_EDGE_NAME].join(EDGE_KEY_DELIM);
}

function edgeArgsToObj(
  isDirected: boolean,
  v_: NodeId,
  w_: NodeId,
  name?: EdgeName
): Edge {
  let v = v_;
  let w = w_;
  if (!isDirected && (v as string) > (w as string)) {
    [v, w] = [w, v];
  }
  const edgeObj: Edge = { v, w };
  if (name) {
    edgeObj.name = name;
  }
  return edgeObj;
}

function edgeObjToId(isDirected: boolean, edgeObj: Edge): EdgeId {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}

// Implementation notes:
//
//  * Node id query functions should return id objects for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.

interface GraphOptions {
  directed?: boolean; // default: true.
  multigraph?: boolean; // default: false.
  compound?: boolean; // default: false.
}

export class Graph {
  private _isDirected: boolean;
  private _isMultigraph: boolean;
  private _isCompound: boolean;
  private _label: GraphLabel;
  private _defaultNodeLabelFn: FactoryFunc<NodeLabel>;
  private _defaultEdgeLabelFn: FactoryFunc<EdgeLabel>;
  private _nodes: Map<NodeId, NodeValue>;

  // _parent, _children only valid if _isCompound
  private _parent!: Map<NodeId, NodeId>;
  private _children!: DefinedMap<NodeId, Set<NodeId>>;

  /**
   * @argument {Object} opts - defaults:  `{ directed: true, multigraph: false, compound: false }`
   *
   */
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
    this._nodes = new Map<NodeId, NodeValue>();

    if (this._isCompound) {
      // v -> parent
      this._parent = new Map<NodeId, NodeId>();

      // v -> children
      this._children = new DefinedMap<NodeId, Set<NodeId>>();
      this._children.set(GRAPH_NODE, new Set<NodeId>());
    }
  }

  // v -> e -> edgeObj
  private _inEdges = new DefinedMap<NodeId, Map<EdgeId, Edge>>();

  // u -> v -> Number
  private _predecessors = new DefinedMap<NodeId, Map<NodeId, number>>();

  // v -> e -> edgeObj
  private _outEdges = new DefinedMap<NodeId, Map<EdgeId, Edge>>();

  // v -> w -> Number
  private _successors = new DefinedMap<NodeId, Map<NodeId, number>>();

  // e -> edgeObj
  private _edgeObjs = new DefinedMap<EdgeId, Edge>();

  // e -> label
  private _edgeLabels = new DefinedMap<EdgeId, EdgeLabel>();

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
  graph(): GraphLabel {
    return this._label;
  }

  /**
   * Sets the label of the graph.
   *
   * @argument label - label value.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setGraph(label: GraphLabel): Graph {
    this._label = label;
    return this;
  }

  /* === Node functions ========== */

  /**
   * Sets the default node label or node label factory function.
   *
   * If set with a label, the label will be assigned as default label
   * in case if no label was specified while setting a node.
   *
   * If set with a node label factory function, the function will be invoked
   * each time when setting a node with no label specified and returned value
   * will be used as a label for node.
   *
   * Complexity: O(1).
   *
   * @argument newDefault - default node label or factory function.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setDefaultNodeLabel(newDefault: FactoryFunc<NodeLabel> | NodeLabel): Graph {
    this._defaultNodeLabelFn =
      typeof newDefault === "function"
        ? (newDefault as FactoryFunc<NodeLabel>)
        : () => newDefault;
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
   * Gets all nodes of the graph. Note, the in case of compound graph subnodes
   * are not included in list.
   *
   * Complexity: O(1).
   *
   * @returns list of graph nodes.
   */
  nodes(): NodeId[] {
    return [...this._nodes.keys()];
  }

  /**
   * Gets list of nodes without in-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sources(): NodeId[] {
    return this.nodes().filter(v => {
      return !this._inEdges.definedGet(v).size;
    });
  }

  /**
   * Gets list of nodes without out-edges.
   * Complexity: O(|V|).
   *
   * @returns the graph source nodes.
   */
  sinks(): NodeId[] {
    return this.nodes().filter(v => {
      return !this._outEdges.definedGet(v).size;
    });
  }

  /**
   * Creates or updates the value for the node v in the graph. If value is
   * supplied it is set as the value for the node. If value is not supplied
   * and the node was created by this call then the default node value will
   * be assigned.
   *
   * Complexity: O(1).
   *
   * @argument v - node id.
   * @argument value - value to set for node.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setNode(v: NodeId, value?: NodeValue): Graph {
    if (v === undefined || v === null) {
      throw new NodeIdError("Node IDs cannot be null or undefined");
    }

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
      this._children.set(v, new Set<NodeId>());
      this._children.definedGet(GRAPH_NODE).add(v);
    }
    this._inEdges.set(v, new Map<EdgeId, Edge>());
    this._predecessors.set(v, new Map<NodeId, number>());
    this._outEdges.set(v, new Map<EdgeId, Edge>());
    this._successors.set(v, new Map<NodeId, number>());
    this._nodeCount += 1;
    return this;
  }

  /**
   * Invokes setNode method for each node in id list.
   *
   * Complexity: O(|ids|).
   *
   * @argument vs - list of nodes id to be set.
   * @argument value - value to set for each node in list.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setNodes(vs: NodeId[], value?: NodeValue): Graph {
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
   * Gets the label of node with specified id.
   *
   * Complexity: O(|V|).
   *
   * @argument v - id of the node.
   * @returns label value of the node.
   */
  node(v: NodeId): NodeValue {
    return this._nodes.get(v);
  }

  /**
   * Detects whether graph has a node with specified id or not.
   *
   * @argument v - id of the node.
   * @returns true if graph has node with specified id, false - otherwise.
   */
  hasNode(v: NodeId): boolean {
    return this._nodes.has(v);
  }

  /**
   * Remove the node with the id from the graph or do nothing if the node is
   * not in the graph. If the node was removed this function also removes any
   * incident edges.
   *
   * Complexity: O(1).
   *
   * @argument v - id of the node.
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeNode(v: NodeId): Graph {
    if (this._nodes.has(v)) {
      const removeEdge = (e: EdgeId) => {
        this.removeEdge(this._edgeObjs.definedGet(e));
      };
      this._nodes.delete(v);
      if (this._isCompound) {
        this._removeFromParentsChildList(v);
        this._parent.delete(v);
        this.children(v)?.forEach(child => {
          this.setParent(child);
        });
        this._children.delete(v);
      }
      for (const key of this._inEdges.definedGet(v).keys()) {
        removeEdge(key);
      }
      this._inEdges.delete(v);
      this._predecessors.delete(v);
      for (const key of this._outEdges.definedGet(v).keys()) {
        removeEdge(key);
      }
      this._outEdges.delete(v);
      this._successors.delete(v);
      this._nodeCount -= 1;
    }
    return this;
  }

  /**
   * Sets node p as a parent for node v if it is defined, or removes the
   * parent for v if p is undefined. Method throws an exception in case of
   * invoking it in context of noncompound graph.
   *
   * Average-case complexity: O(1).
   *
   * @argument v - node to be child for p.
   * @argument p - node to be parent for v.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setParent(v: NodeId, p?: NodeId): Graph {
    if (!this._isCompound) {
      throw new Error("Cannot set parent in a non-compound graph");
    }

    let parent = p;
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
        ancestor = this.parent(ancestor);
      }

      this.setNode(parent);
    }

    this.setNode(v);
    this._removeFromParentsChildList(v);
    this._parent.set(v, parent);
    this._children.definedGet(parent).add(v);
    return this;
  }

  private _removeFromParentsChildList(v: NodeId): void {
    this._children.definedGet(this._parent.get(v)).delete(v);
  }

  /**
   * Gets parent node for node v.
   *
   * Complexity: O(1).
   *
   * @argument v - node to get parent of.
   * @returns parent node id or undefined if v has no parent.
   */
  parent(v: NodeId): NodeId | undefined {
    if (this._isCompound) {
      const parent = this._parent.get(v);
      if (parent !== GRAPH_NODE) {
        return parent;
      }
    }
  }

  /**
   * Gets list of direct children of node v.
   *
   * Complexity: O(1).
   *
   * @argument v_ - node to get children of.
   * @returns children nodes id list.
   */
  children(v_?: NodeId): NodeId[] | undefined {
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
   * Return all nodes that are predecessors of the specified node or
   * undefined if node v is not in the graph. Behavior is undefined for
   * undirected graphs - use neighbors instead.
   *
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  predecessors(v: NodeId): NodeId[] | undefined {
    const predsV = this._predecessors.get(v);
    if (predsV) {
      return [...predsV.keys()];
    }
  }

  /**
   * Return all nodes that are successors of the specified node or undefined
   * if node v is not in the graph. Behavior is undefined for undirected
   * graphs - use neighbors instead.
   *
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  successors(v: NodeId): NodeId[] | undefined {
    const sucsV = this._successors.get(v);
    if (sucsV) {
      return [...sucsV.keys()];
    }
  }

  /**
   * Return all nodes that are predecessors or successors of the specified
   * node or undefined if node v is not in the graph.
   *
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns node identifiers list or undefined if v is not in the graph.
   */
  neighbors(v: NodeId): NodeId[] | undefined {
    const neighbors = this.predecessors(v);
    if (neighbors) {
      const uniqueNeighbors = new Set<NodeId>(neighbors);
      for (const s of this.successors(v) ?? []) {
        if (!uniqueNeighbors.has(s)) {
          neighbors.push(s);
          uniqueNeighbors.add(s);
        }
      }
      return neighbors;
    }
  }

  /**
   * Checks if a node v has no successors in a directed graph or no neighbors
   * in an undirected graph.
   * Complexity: O(|V|).
   *
   * @argument v - node identifier.
   * @returns whether the node is a leaf.
   */
  isLeaf(v: NodeId): boolean {
    let neighbors;
    if (this.isDirected()) {
      neighbors = this.successors(v);
    } else {
      neighbors = this.neighbors(v);
    }
    return !!(neighbors && !neighbors.length);
  }

  /**
   * Creates new graph with nodes filtered via filter. Edges incident to
   * rejected node are also removed. In case of compound graph, if parent is
   * rejected by filter, than all its children are rejected too.
   *
   * Average-case complexity: O(|E|+|V|).
   *
   * @argument filter - filtration function detecting whether the node should stay or not.
   * @returns new graph made from current and nodes filtered.
   */
  filterNodes(filter: (v: NodeId) => boolean): Graph {
    const copy = new Graph({
      directed: this._isDirected,
      multigraph: this._isMultigraph,
      compound: this._isCompound,
    });

    copy.setGraph(this.graph());

    for (const [v, value] of this._nodes.entries()) {
      if (filter(v)) {
        copy.setNode(v, value);
      }
    }

    for (const e of this._edgeObjs.values()) {
      if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
        copy.setEdge(e, this.edge(e));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const parents = new Map<NodeId, NodeId>();
    function findParent(v: NodeId): NodeId {
      const parent = self.parent(v);
      if (parent === undefined || copy.hasNode(parent)) {
        parents.set(v, parent);
        return parent;
      } else if (parents.has(parent)) {
        return parents.get(parent);
      } else {
        return findParent(parent);
      }
    }

    if (this._isCompound) {
      copy.nodes().forEach(v => {
        copy.setParent(v, findParent(v));
      });
    }

    return copy;
  }

  /* === Edge functions ========== */

  /**
   * Sets the default edge label or edge label factory function.
   *
   * If set with a label, the label will be assigned as default label
   * in case if no label was specified while setting an edge.
   *
   * If set with a function, the function will be invoked
   * each time when setting an edge with no label specified and returned value
   * will be used as a label for edge.
   *
   * Complexity: O(1).
   *
   * @argument newDefault - default edge label or factory function.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setDefaultEdgeLabel(newDefault: FactoryFunc<EdgeLabel> | EdgeLabel): Graph {
    this._defaultEdgeLabelFn =
      typeof newDefault === "function"
        ? (newDefault as FactoryFunc<EdgeLabel>)
        : () => newDefault;
    return this;
  }

  /**
   * Gets the number of edges in the graph.
   *
   * Complexity: O(1).
   *
   * @returns edges count.
   */
  edgeCount(): number {
    return this._edgeCount;
  }

  /**
   * Gets edges of the graph. In case of compound graph subgraphs are
   * not considered.
   *
   * Complexity: O(|E|).
   *
   * @return graph edges list.
   */
  edges(): Edge[] {
    return [...this._edgeObjs.values()];
  }

  /**
   * Creates or updates the label for the specified edge. If label is
   * supplied it is set as the value for the edge. If label is not supplied and
   * the edge was created by this call then the default edge label will
   * be assigned. The name parameter is only useful with multigraphs.
   *
   * Complexity: O(1).
   *
   * @argument edge - edge descriptor.
   * @argument value - value to associate with the edge.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setEdge(edge: Edge, value?: EdgeValue): Graph;
  /**
   * Creates or updates the label for the edge (v, w) with the optionally
   * supplied name. If label is supplied it is set as the value for the edge.
   * If label is not supplied and the edge was created by this call then the
   * default edge label will be assigned. The name parameter is only useful
   * with multigraphs.
   *
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument value - value to associate with the edge.
   * @argument name - unique name of the edge in order to identify it in multigraph.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setEdge(v: NodeId, w: NodeId, value?: EdgeValue, name?: EdgeName): Graph;
  setEdge(
    edgeOrV: Edge | NodeId,
    valueOrW?: EdgeValue | NodeId,
    value_?: EdgeValue,
    name_?: EdgeName
  ): Graph {
    let v: Edge | NodeId;
    let w: EdgeValue | NodeId;
    let value: EdgeValue;
    let name: EdgeName;
    let valueSpecified = false;

    if (isEdge(edgeOrV)) {
      ({ v, w, name } = edgeOrV);
      if (arguments.length === 2) {
        value = valueOrW;
        valueSpecified = true;
      }
    } else {
      v = edgeOrV;
      w = valueOrW;
      name = name_;
      if (arguments.length > 2) {
        value = value_;
        valueSpecified = true;
      }
    }

    const e = edgeArgsToId(this._isDirected, v, w, name);
    if (this._edgeLabels.has(e)) {
      if (valueSpecified) {
        this._edgeLabels.set(e, value);
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

    this._edgeLabels.set(
      e,
      valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name)
    );

    const edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
    // Ensure we add undirected edges in a consistent way.
    ({ v, w } = edgeObj);

    Object.freeze(edgeObj);
    this._edgeObjs.set(e, edgeObj);
    incrementOrInitEntry(this._predecessors.definedGet(w), v);
    incrementOrInitEntry(this._successors.definedGet(v), w);
    this._inEdges.definedGet(w).set(e, edgeObj);
    this._outEdges.definedGet(v).set(e, edgeObj);
    this._edgeCount += 1;
    return this;
  }

  /**
   * Establish an edges path over the nodes in nodes list. If an edge already
   * exists, it will update its value, otherwise it will create an edge
   * between pair of nodes with value provided or default value if no
   * value provided.
   *
   * Complexity: O(|nodes|).
   *
   * @argument vs - list of nodes to be connected in series.
   * @argument value - value to set for each edge between pairs of nodes.
   * @returns the graph, allowing this to be chained with other functions.
   */
  setPath(vs: NodeId[], value?: EdgeValue): Graph {
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
   *
   * Complexity: O(1).
   *
   * @argument e - edge descriptor.
   * @returns value associated with specified edge.
   */
  edge(e: Edge): EdgeValue;
  /**
   * Gets the label for the specified edge.
   *
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns value associated with specified edge.
   */
  edge(v: NodeId, w: NodeId, name?: EdgeName): EdgeValue;
  edge(edgeOrV: Edge | NodeId, w?: NodeId, name?: EdgeName): EdgeValue {
    const e = isEdge(edgeOrV)
      ? edgeObjToId(this._isDirected, edgeOrV)
      : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    return this._edgeLabels.get(e);
  }

  /**
   * Detects whether the graph contains specified edge or not. No subgraphs
   * are considered.
   *
   * Complexity: O(1).
   *
   * @argument e - edge descriptor.
   * @returns whether the graph contains the specified edge or not.
   */
  hasEdge(e: Edge): boolean;
  /**
   * Detects whether the graph contains specified edge or not. No subgraphs
   * are considered.
   *
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns whether the graph contains the specified edge or not.
   */
  hasEdge(v: NodeId, w: NodeId, name?: EdgeName): boolean;
  hasEdge(edgeOrV: Edge | NodeId, w?: NodeId, name?: EdgeName): boolean {
    const e = isEdge(edgeOrV)
      ? edgeObjToId(this._isDirected, edgeOrV)
      : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    return this._edgeLabels.has(e);
  }

  /**
   * Removes the specified edge from the graph. No subgraphs are considered.
   *
   * Complexity: O(1).
   *
   * @argument e - edge descriptor.
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeEdge(e: Edge): Graph;
  /**
   * Removes the specified edge from the graph. No subgraphs are considered.
   *
   * Complexity: O(1).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @argument name - name of the edge (actual for multigraph).
   * @returns the graph, allowing this to be chained with other functions.
   */
  removeEdge(v: NodeId, w: NodeId, name?: EdgeName): Graph;
  removeEdge(edgeOrV: Edge | NodeId, w?: NodeId, name?: EdgeName): Graph {
    const e = isEdge(edgeOrV)
      ? edgeObjToId(this._isDirected, edgeOrV)
      : edgeArgsToId(this._isDirected, edgeOrV, w, name);
    const edge = this._edgeObjs.get(e);
    if (edge) {
      const { v: v_, w: w_ } = edge;
      this._edgeLabels.delete(e);
      this._edgeObjs.delete(e);
      decrementOrRemoveEntry(this._predecessors.definedGet(w_), v_);
      decrementOrRemoveEntry(this._successors.definedGet(v_), w_);
      this._inEdges.definedGet(w_).delete(e);
      this._outEdges.definedGet(v_).delete(e);
      this._edgeCount -= 1;
    }
    return this;
  }

  /**
   * Return all edges that point to the node v. Optionally filters those edges
   * down to just those coming from node u. Behavior is undefined for
   * undirected graphs - use nodeEdges instead.
   *
   * Complexity: O(|E|).
   *
   * @argument v - edge sink node.
   * @argument u - edge source node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  inEdges(v: NodeId, u?: NodeId): Edge[] | undefined {
    const inV = this._inEdges.get(v);
    if (inV) {
      const edges = [...inV.values()];
      if (!u) {
        return edges;
      }
      return edges.filter(edge => edge.v === u);
    }
  }

  /**
   * Return all edges that are pointed at by node v. Optionally filters those
   * edges down to just those point to w. Behavior is undefined for undirected
   * graphs - use nodeEdges instead.
   *
   * Complexity: O(|E|).
   *
   * @argument v - edge source node.
   * @argument w - edge sink node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  outEdges(v: NodeId, w?: NodeId): Edge[] | undefined {
    const outV = this._outEdges.get(v);
    if (outV) {
      const edges = [...outV.values()];
      if (!w) {
        return edges;
      }
      return edges.filter(edge => edge.w === w);
    }
  }

  /**
   * Returns all edges to or from node v regardless of direction. Optionally
   * filters those edges down to just those between nodes v and w regardless
   * of direction.
   *
   * Complexity: O(|E|).
   *
   * @argument v - edge adjacent node.
   * @argument w - edge adjacent node.
   * @returns edges descriptors list if v is in the graph, or undefined otherwise.
   */
  nodeEdges(v: NodeId, w?: NodeId): Edge[] | undefined {
    const inEdges = this.inEdges(v, w);
    if (inEdges) {
      return inEdges.concat(this.outEdges(v, w) ?? []);
    }
  }
}
