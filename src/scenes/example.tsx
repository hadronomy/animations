import { makeScene2D } from "@motion-canvas/2d";

import { NodeGraph } from "~/components/NodeGraph";

export default makeScene2D(function* (view) {
  yield* NodeGraph(view);
});
