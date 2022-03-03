import type { Graph } from "../graph";

export class CycleException extends Error {}

/**
 * Given a Graph graph this function applies topological sorting to it.
 * If the graph has a cycle it is impossible to generate such a list and CycleException is thrown.
 * Complexity: O(|V| + |E|).
 *
 * @argument g - graph to apply topological sorting to.
 * @returns an array of nodes such that for each edge u -> v, u appears before v in the array.
 */
export function topsort(g: Graph): unknown[] {
  const visited = new Set<unknown>();
  const stack = new Set<unknown>();
  const results: unknown[] = [];

  function visit(node: unknown) {
    if (stack.has(node)) {
      throw new CycleException();
    }

    if (!visited.has(node)) {
      stack.add(node);
      visited.add(node);
      g.predecessors(node)?.forEach(visit);
      stack.delete(node);
      results.push(node);
    }
  }

  g.sinks().forEach(visit);

  if (visited.size !== g.nodeCount()) {
    throw new CycleException();
  }

  return results;
}
