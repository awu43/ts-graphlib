import { PriorityQueue } from "../data/priority-queue";
import { DefinedMap } from "../defined-map";
import { Graph } from "../graph";
import type { Edge, NodeId } from "../graph";

import type { WeightFn } from "./dijkstra";

/**
 * Prim's algorithm takes a connected undirected graph and generates a minimum spanning tree. This
 * function returns the minimum spanning tree as an undirected graph. This algorithm is derived
 * from the description in "Introduction to Algorithms", Third Edition, Cormen, et al., Pg 634.
 * Complexity: O(|E| * log |V|);
 *
 * @argument g - graph to generate a minimum spanning tree of.
 * @argument weightFn - function which takes edge e and returns the weight of it. It throws an Error if
 *           the graph is not connected.
 * @returns minimum spanning tree of graph.
 */
export function prim(g: Graph, weightFn: WeightFn): Graph {
  const result = new Graph();
  const parents = new DefinedMap<NodeId, NodeId>();
  const pq = new PriorityQueue<NodeId>();
  let v: NodeId;

  function updateNeighbors(edge: Edge) {
    const w = edge.v === v ? edge.w : edge.v;
    const pri = pq.priority(w);
    if (pri !== undefined) {
      const edgeWeight = weightFn(edge);
      if (edgeWeight < pri) {
        parents.set(w, v);
        pq.decrease(w, edgeWeight);
      }
    }
  }

  if (!g.nodeCount()) {
    return result;
  }

  g.nodes().forEach(v_ => {
    pq.add(v_, Number.POSITIVE_INFINITY);
    result.setNode(v_);
  });

  // Start from an arbitrary node
  pq.decrease(g.nodes()[0], 0);

  let init = false;
  while (pq.size() > 0) {
    v = pq.removeMin();
    if (parents.has(v)) {
      result.setEdge(v, parents.definedGet(v));
    } else if (init) {
      throw new Error(`Input graph is not connected: ${g}`);
    } else {
      init = true;
    }

    g.nodeEdges(v)?.forEach(updateNeighbors);
  }

  return result;
}
