import { Graph, type Edge } from "../../src/graph";

export function edgeWeightFn(g: Graph): (e: Edge) => number {
  return edge => g.edge(edge) as number;
}
