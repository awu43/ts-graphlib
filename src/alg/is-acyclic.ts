import type Graph from "../graph";

import topsort from "./topsort";

export default function isAcyclic(g: Graph): boolean {
  try {
    topsort(g);
  } catch (e) {
    if (e instanceof topsort.CycleException) {
      return false;
    }
    throw e;
  }
  return true;
}
