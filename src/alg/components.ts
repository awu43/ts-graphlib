import type { Graph, NodeId } from "../graph";

/**
 * Finds all connected components in a graph and returns an array of
 * these components. Each component is itself an array that contains the ids
 * of nodes in the component.
 *
 * Complexity: O(|V|).
 *
 * @argument g - graph to find components in.
 * @returns array of nodes list representing components
 */
export function components(g: Graph): NodeId[][] {
  const visited = new Set<NodeId>();
  const cmpts: NodeId[][] = [];

  g.nodes.forEach(v => {
    const cmpt: NodeId[] = [];

    function dfs(v_: NodeId): void {
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
