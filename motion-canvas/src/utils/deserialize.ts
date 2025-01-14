import type { GraphData } from '~/types/graph';
import { z } from 'zod';
import { useLogger } from '@motion-canvas/core';

const GraphRowSchema = z
  .object({
    source: z.string(),
    target: z.string().optional(),
  })
  .strict();

export type RawGraphRow = z.infer<typeof GraphRowSchema>;

export function deserializeGraphFromArray(graph: Array<RawGraphRow>) {
  const rows = z.array(GraphRowSchema).parse(graph);
  const nodeSet = new Set<string>();
  const edges: Array<{ source: string; target: string }> = [];

  for (const row of rows) {
    nodeSet.add(row.source);
    if (row.target) {
      nodeSet.add(row.target);
      edges.push({ source: row.source, target: row.target });
    }
  }

  const nodes = Array.from(nodeSet).map((id) => ({ id }));
  return { nodes, edges };
}
