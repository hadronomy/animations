import {
  Vertex,
  Edge,
  type AdjacencyList,
  type GraphData,
} from '~/types/graph';

function createInitialCycle(n: number): AdjacencyList {
  const graph = new Map();
  for (let i = 0; i < n; i++) {
    graph.set(i, new Set([(i + 1) % n]));
  }
  return graph;
}

function addRandomEdges(
  graph: AdjacencyList,
  n: number,
  targetEdgeCount: number,
): void {
  const currentEdgeCount = [...graph.values()].reduce(
    (sum, edges) => sum + edges.size,
    0,
  );

  while (
    [...graph.values()].reduce((sum, edges) => sum + edges.size, 0) <
    targetEdgeCount
  ) {
    const from = Math.floor(Math.random() * n);
    const to = Math.floor(Math.random() * n);

    if (from !== to && !graph.get(from)?.has(to)) {
      graph.get(from)?.add(to);
    }
  }
}

export function generateStronglyConnectedGraph(
  n: number,
  m?: number,
): GraphData {
  if (n < 2) throw new Error('Graph must have at least 2 vertices');

  const targetEdges = m ?? n + Math.floor(Math.random() * (n * (n - 1) - n));
  if (targetEdges < n || targetEdges > n * (n - 1)) {
    throw new Error('Invalid number of edges');
  }

  const adjList = createInitialCycle(n);
  addRandomEdges(adjList, n, targetEdges);

  return {
    nodes: Array.from({ length: n }, (_, i) => ({
      id: `K${i + 1}`,
    })),
    edges: Array.from(adjList.entries()).flatMap(([from, tos]) =>
      Array.from(tos).map((to) => ({
        source: `K${from + 1}`,
        target: `K${to + 1}`,
      })),
    ),
  };
}
