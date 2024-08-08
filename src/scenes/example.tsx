import { makeScene2D } from '@motion-canvas/2d';
import { createRef, waitFor } from '@motion-canvas/core';

import { Graph } from '../components/NodeGraph';

export default makeScene2D(function* (view) {
  const graph = createRef<Graph>();

  view.add(<Graph ref={graph} x={-500} y={-400} />);
  yield* graph().animateIn();
  yield* waitFor(1);
});
