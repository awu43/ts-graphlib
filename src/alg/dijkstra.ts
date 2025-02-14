import { PriorityQueue } from "../data/priority-queue";
import type { Graph, Edge, NodeId } from "../graph";

import type { WeightFn, EdgeFn, Path, PathMap } from "./types";

const DEFAULT_WEIGHT_FUNC = () => 1;

function runDijkstra(
  g: Graph,
  source: NodeId,
  weightFn: WeightFn,
  edgeFn: EdgeFn
): PathMap {
  const results: PathMap = {};
  const pq = new PriorityQueue<NodeId>();
  let v: NodeId;
  let vEntry: Path;

  function updateNeighbors(edge: Edge): void {
    const w = edge.v !== v ? edge.v : edge.w;
    const wEntry = results[w];
    const weight = weightFn(edge);
    const distance = vEntry.distance + weight;

    if (weight < 0) {
      throw new Error(
        `dijkstra does not allow negative edge weights. Bad edge: ${edge} Weight: ${weight}`
      );
    }

    if (distance < wEntry.distance) {
      wEntry.distance = distance;
      wEntry.predecessor = v;
      pq.decrease(w, distance);
    }
  }

  g.nodes.forEach(v_ => {
    const distance = v_ === source ? 0 : Number.POSITIVE_INFINITY;
    results[v_] = { distance };
    pq.add(v_, distance);
  });

  while (pq.size() > 0) {
    v = pq.removeMin();
    vEntry = results[v];
    if (vEntry.distance === Number.POSITIVE_INFINITY) {
      break;
    }

    edgeFn(v)?.forEach(updateNeighbors);
  }

  return results;
}

/**
 * This function is an implementation of Dijkstra's algorithm which finds the
 * shortest path from source to all other nodes in graph. This function returns
 * a map of v -> { distance, predecessor }. The distance property holds the sum
 * of the weights from source to v along the shortest path or
 * Number.POSITIVE_INFINITY if there is no path from source. The predecessor
 * property can be used to walk the individual elements of the path from source
 * to v in reverse order.
 *
 * Complexity: O((|E| + |V|) * log |V|).
 *
 * @argument g - graph where to search pathes.
 * @argument source - node to start pathes from.
 * @argument weightFn - function which takes edge e and returns the weight of
 * it. If no weightFn is supplied then each edge is assumed to have a weight
 * of 1. This function throws an Error if any of the traversed edges have a
 * negative edge weight.
 * @argument edgeFn - function which takes a node v and returns the ids of all
 * edges incident to it for the purposes of shortest path traversal. By default
 * this function uses the graph.outEdges.
 * @returns shortest pathes map that starts from node source
 */
export function dijkstra(
  g: Graph,
  source: NodeId,
  weightFn?: WeightFn,
  edgeFn?: EdgeFn
): PathMap {
  return runDijkstra(
    g,
    source,
    weightFn ?? DEFAULT_WEIGHT_FUNC,
    edgeFn ?? ((v: NodeId) => g.outEdges(v))
  );
}
