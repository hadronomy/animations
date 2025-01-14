import { makeScene2D } from '@motion-canvas/2d';
import { all, createRef, waitFor, useLogger } from '@motion-canvas/core';

import { Graph } from '~/components/NodeGraph';

import exampleGraph from './example-graph.csv';
import { deserializeGraphFromArray, type RawGraphRow } from '~/utils/deserialize';

const graphData = deserializeGraphFromArray(exampleGraph as RawGraphRow[]);

export default makeScene2D(function* (view) {
  const graph = createRef<Graph>();

  view.add(
    <Graph
      ref={graph}
      scale={3}
      backgroundColor="#242424"
      textColor="#FFFFFF"
      layout="cose"
      nodeSize={20}
      arrowScale={0.15}
      highlightColor="#FF9800"
      animationDuration={1.5}
      nodes={graphData.nodes}
      edges={graphData.edges}
    />
  );
  yield* graph().animateIn(5);
  yield* waitFor(1);
  yield* all(graph().scale(2.2, 1), graph().stabilizedRotation(20, 1.5)); 
  yield* waitFor(1);

  yield* graph().animateBFS('BCN');
  
  const bfsResult = graph().runBfs('BCN');
  
  const path = bfsResult.path.toArray()
    .slice(0, bfsResult.path.length)
    .map(node => node.id());

  yield* graph().highlightPath(path);
  yield* waitFor(1);
});
