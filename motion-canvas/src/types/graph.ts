export type Vertex = number;
export type Edge = [Vertex, Vertex];
export type AdjacencyList = Map<Vertex, Set<Vertex>>;

export interface GraphData {
  nodes: Array<{ id: string }>;
  edges: Array<{ source: string; target: string }>;
}
