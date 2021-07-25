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
  const visited = new Set<string>();
  const cmpts: string[][] = [];

  g.nodes().forEach(v => {
    const cmpt: string[] = [];

    function dfs(v_: string) {
      if (visited.has(v_)) {
        return;
      }
      visited.add(v_);
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
