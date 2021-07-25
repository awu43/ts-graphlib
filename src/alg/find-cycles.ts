import tarjan from "./tarjan";
import type Graph from "../graph";

/**
 * Given a Graph, graph, this function returns all nodes that are part of a cycle. As there
 * may be more than one cycle in a graph this function return an array of these cycles,
 * where each cycle is itself represented by an array of ids for each node involved in
 * that cycle. Method alg.isAcyclic is more efficient if you only need to determine whether a graph has a
 * cycle or not.
 * Complexity: O(|V| + |E|).
 *
 * @argument graph - graph where to search cycles.
 * @returns cycles list.
 */
export default function findCycles(g: Graph): unknown[][] {
  return tarjan(g).filter(
    cmpt =>
      cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]))
  );
}
