import type { Graph } from "../graph";

import { dijkstra } from "./dijkstra";
import type { WeightFn, EdgeFn, AllPathsMap } from "./types";

/**
 * This function finds the shortest path from each node to every other
 * reachable node in the graph. It is similar to alg.dijkstra, but instead
 * of returning a single-source array, it returns a mapping of
 * source -> alg.dijksta(g, source, weightFn, edgeFn).
 *
 * Complexity: O(|V| * (|E| + |V|) * log |V|).
 *
 * @argument g - graph where to search pathes.
 * @argument weightFn - function which takes edge e and returns the weight
 * of it. If no weightFn is supplied then each edge is assumed to have a
 * weight of 1. This function throws an Error if any of the traversed edges
 * have a negative edge weight.
 * @argument edgeFn - function which takes a node v and returns the ids of all
 * edges incident to it for the purposes of shortest path traversal. By default
 * this function uses the graph.outEdges.
 * @returns shortest paths map.
 */
export function dijkstraAll(
  g: Graph,
  weightFn?: WeightFn,
  edgeFn?: EdgeFn
): AllPathsMap {
  const acc: AllPathsMap = {};
  const { nodes } = g;
  for (let i = 0; i < nodes.length; i++) {
    const v = nodes[i];
    acc[v] = dijkstra(g, v, weightFn, edgeFn);
  }

  return acc;
}
