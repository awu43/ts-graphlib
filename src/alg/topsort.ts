import * as utils from "../utils";
import type Graph from "../graph";

class CycleException extends Error {}

/**
 * Given a Graph graph this function applies topological sorting to it.
 * If the graph has a cycle it is impossible to generate such a list and CycleException is thrown.
 * Complexity: O(|V| + |E|).
 *
 * @argument graph - graph to apply topological sorting to.
 * @returns an array of nodes such that for each edge u -> v, u appears before v in the array.
 */
export default function topsort(g: Graph): string[] {
  const visited: Record<string, boolean> = {};
  const stack: Record<string, boolean> = {};
  const results: string[] = [];

  function visit(node: string) {
    if (utils.has(stack, node)) {
      throw new CycleException();
    }

    if (!utils.has(visited, node)) {
      stack[node] = true;
      visited[node] = true;
      g.predecessors(node)?.forEach(visit);
      delete stack[node];
      results.push(node);
    }
  }

  g.sinks().forEach(visit);

  if (Object.keys(visited).length !== g.nodeCount()) {
    throw new CycleException();
  }

  return results;
}
topsort.CycleException = CycleException;
