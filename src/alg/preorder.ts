import type Graph from "../graph";

import dfs from "./dfs";

/**
 * Performs pre-order depth first traversal on the input graph. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * @argument g - depth first traversal target.
 * @argument vs - nodes list to traverse.
 * @returns the nodes in the order they were visited as a list of their names.
 */
export default function preorder(g: Graph, vs: unknown | unknown[]): unknown[] {
  return dfs(g, vs, "pre");
}
