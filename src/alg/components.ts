import * as utils from "../utils";

import type Graph from "../graph";

/**
 * Finds all connected components in a graph and returns an array of these components.
 * Each component is itself an array that contains the ids of nodes in the component.
 * Complexity: O(|V|).
 *
 * @argument graph - graph to find components in.
 * @returns array of nodes list representing components
 */
export default function components(g: Graph): string[][] {
  const visited: Record<string, boolean> = {};
  const cmpts: string[][] = [];

  g.nodes().forEach(v => {
    const cmpt: string[] = [];

    function dfs(v_: string) {
      if (utils.has(visited, v_)) {
        return;
      }
      visited[v_] = true;
      cmpt.push(v_);
      g.successors(v_)?.forEach(dfs);
      g.predecessors(v_)?.forEach(dfs);
    }

    dfs(v);
    if (cmpt.length) {
      cmpts.push(cmpt);
    }
  });

  return cmpts;
}
