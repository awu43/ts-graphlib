import { DefinedMap } from "../defined-map";
import type { Graph, NodeId } from "../graph";

type Node = {
  onStack: boolean;
  lowlink: number;
  index: number;
};

/**
 * This function is an implementation of Tarjan's algorithm which finds all
 * strongly connected components in the directed graph g. Each strongly
 * connected component is composed of nodes that can reach all other nodes in
 * the component via directed edges. A strongly connected component can consist
 * of a single node if that node cannot both reach and be reached by any other
 * specific node in the graph. Components of more than one node are guaranteed
 * to have at least one cycle.
 *
 * Complexity: O(|V| + |E|).
 *
 * @argument g - graph to find all strongly connected components of.
 * @return  an array of components. Each component is itself an array that
 * contains the ids of all nodes in the component.
 */
export function tarjan(g: Graph): NodeId[][] {
  let index = 0;
  const stack: NodeId[] = [];
  const visited = new DefinedMap<NodeId, Node>();
  const results: NodeId[][] = [];

  function dfs(v: NodeId): void {
    const entry = {
      onStack: true,
      lowlink: index,
      index,
    };
    visited.set(v, entry);
    index += 1;
    stack.push(v);

    g.successors(v)?.forEach(w => {
      if (!visited.has(w)) {
        dfs(w);
        entry.lowlink = Math.min(entry.lowlink, visited.definedGet(w).lowlink);
      } else if (visited.definedGet(w).onStack) {
        entry.lowlink = Math.min(entry.lowlink, visited.definedGet(w).index);
      }
    });

    if (entry.lowlink === entry.index) {
      const cmpt = [];
      let w;
      do {
        w = stack.pop() as NodeId;
        visited.definedGet(w).onStack = false;
        cmpt.push(w);
      } while (v !== w);
      results.push(cmpt);
    }
  }

  g.nodes.forEach(v => {
    if (!visited.has(v)) {
      dfs(v);
    }
  });

  return results;
}
