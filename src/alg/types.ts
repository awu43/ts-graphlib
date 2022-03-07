import type { Edge, NodeId } from "../graph";

export type WeightFn = (e: Edge) => number;
export type EdgeFn = (v: NodeId) => Edge[] | undefined;
export interface Path {
  distance: number;
  predecessor?: NodeId;
}
export type PathMap = Record<NodeId, Path>;
export type AllPathsMap = Record<NodeId, PathMap>;
