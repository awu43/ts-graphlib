import * as utils from "../utils";

import type Graph from "../graph";

function doDfs(
  g: Graph,
  v: string,
  postorder: boolean,
  visited: Record<string, boolean>,
  navigation: (v_: string) => string[] | void,
  acc: string[]
) {
  if (!utils.has(visited, v)) {
    visited[v] = true;

    if (!postorder) {
      acc.push(v);
    }
    navigation(v)?.forEach(w => {
      doDfs(g, w, postorder, visited, navigation, acc);
    });
    if (postorder) {
      acc.push(v);
    }
  }
}

/*
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 */
export default function dfs(
  g: Graph,
  vs_: string[] | string,
  order: string
): string[] {
  const vs = Array.isArray(vs_) ? vs_ : [vs_];

  const navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);

  const acc: string[] = [];
  const visited: Record<string, boolean> = {};
  vs.forEach(v => {
    if (!g.hasNode(v)) {
      throw new Error(`Graph does not have node: ${v}`);
    }

    doDfs(g, v, order === "post", visited, navigation, acc);
  });
  return acc;
}
