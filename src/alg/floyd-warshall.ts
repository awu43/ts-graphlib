/* eslint-disable import/no-duplicates */
import type Graph from "../graph";
import type { Edge } from "../graph";

import type { WeightFn, EdgeFn } from "./dijkstra";
import type { AllPathsMap } from "./dijkstra-all";

const DEFAULT_WEIGHT_FUNC = () => 1;

function runFloydWarshall(
  g: Graph,
  weightFn: WeightFn,
  edgeFn: EdgeFn
): AllPathsMap {
  const results: AllPathsMap = {};
  const nodes = g.nodes();

  nodes.forEach(v => {
    results[v as string] = {};
    results[v as string][v as string] = { distance: 0 };
    nodes.forEach(w => {
      if ((v as string) !== w) {
        results[v as string][w as string] = {
          distance: Number.POSITIVE_INFINITY,
        };
      }
    });
    edgeFn(v).forEach(edge => {
      const w = edge.v === v ? edge.w : edge.v;
      const d = weightFn(edge);
      results[v as string][w as string] = { distance: d, predecessor: v };
    });
  });

  nodes.forEach(k => {
    const rowK = results[k as string];
    nodes.forEach(i => {
      const rowI = results[i as string];
      nodes.forEach(j => {
        const ik = rowI[k as string];
        const kj = rowK[j as string];
        const ij = rowI[j as string];
        const altDistance = ik.distance + kj.distance;
        if (altDistance < ij.distance) {
          ij.distance = altDistance;
          ij.predecessor = kj.predecessor;
        }
      });
    });
  });

  return results;
}

/**
 * This function is an implementation of the Floyd-Warshall algorithm, which finds the
 * shortest path from each node to every other reachable node in the graph. It is similar
 * to alg.dijkstraAll, but it handles negative edge weights and is more efficient for some types
 * of graphs. This function returns a map of source -> { target -> { distance, predecessor }.
 * The distance property holds the sum of the weights from source to target along the shortest
 * path of Number.POSITIVE_INFINITY if there is no path from source. The predecessor property
 * can be used to walk the individual elements of the path from source to target in reverse
 * order.
 * Complexity: O(|V|^3).
 *
 * @argument graph - graph where to search pathes.
 * @argument weightFn - function which takes edge e and returns the weight of it. If no weightFn
 * is supplied then each edge is assumed to have a weight of 1. This function throws an
 * Error if any of the traversed edges have a negative edge weight.
 * @argument edgeFn - function which takes a node v and returns the ids of all edges incident to it
 * for the purposes of shortest path traversal. By default this function uses the graph.outEdges.
 * @returns shortest pathes map.
 */
export default function floydWarshall(
  g: Graph,
  weightFn: WeightFn,
  edgeFn: EdgeFn
): AllPathsMap {
  return runFloydWarshall(
    g,
    weightFn || DEFAULT_WEIGHT_FUNC,
    edgeFn || ((v: string) => g.outEdges(v) as Edge[])
  );
}
