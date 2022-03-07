import { Graph } from "../../src/graph";
import type { Edge, NodeId } from "../../src/graph";

export function edgeWeightFn(g: Graph): (e: Edge) => number {
  return edge => g.edge(edge) as number;
}

export function sortComponents(cmpts: NodeId[][]): NodeId[][] {
  return cmpts.map(cmpt => cmpt.sort());
}
