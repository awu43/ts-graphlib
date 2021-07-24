import tarjan from "./tarjan";
import type Graph from "../graph";

export default function findCycles(g: Graph): string[][] {
  return tarjan(g).filter(
    cmpt =>
      cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]))
  );
}
