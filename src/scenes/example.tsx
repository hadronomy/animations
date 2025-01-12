import { makeScene2D } from '@motion-canvas/2d';
import { all, createRef, waitFor } from '@motion-canvas/core';

import { Graph } from '../components/NodeGraph';

export default makeScene2D(function* (view) {
  const graph = createRef<Graph>();

  view.add(<Graph ref={graph} backgroundColor={"#242424"} nodeSize={120} x={-500} y={-400} />);
  yield* graph().animateIn();
  yield* waitFor(1);
  yield* all(graph().scale(2, 1), graph().rotation(20, 1.5));
  yield* waitFor(1);
});
