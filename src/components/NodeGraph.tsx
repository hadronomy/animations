import { graphlib, layout } from "@dagrejs/dagre";
import { View2D, Circle, Txt, Line, Code } from "@motion-canvas/2d";
import {
  createRef,
  waitFor,
  sequence,
  all,
  makeRef,
} from "@motion-canvas/core";

export function* NodeGraph(view: View2D) {
  var graph = new graphlib.Graph();
  graph.setGraph({});
  graph.setDefaultEdgeLabel(function () {
    return {};
  });

  const GRAPH_X_OFFSET = -500;
  const NODE_SIZE = 120;
  const NODE_TEXT_RELATION = 2.18;
  const NODE_TEXT_SIZE = NODE_SIZE / NODE_TEXT_RELATION;

  graph.setNode("1", { label: "1", width: NODE_SIZE, height: NODE_SIZE });
  graph.setNode("2", { label: "2", width: NODE_SIZE, height: NODE_SIZE });
  graph.setNode("3", { label: "3", width: NODE_SIZE, height: NODE_SIZE });
  graph.setNode("4", { label: "4", width: NODE_SIZE, height: NODE_SIZE });
  graph.setNode("5", { label: "5", width: NODE_SIZE, height: NODE_SIZE });

  graph.setEdge("1", "4");
  graph.setEdge("2", "3");
  graph.setEdge("3", "4");
  graph.setEdge("4", "5");
  graph.setEdge("5", "2");
  graph.setEdge("5", "1");
  graph.setEdge("5", "3");

  yield layout(graph);
  const graphNodes = graph.nodes().map((node) => graph.node(node));
  const graphEdges = graph.edges().map((edge) => graph.edge(edge));

  const circles: Circle[] = [];
  // Create some rects
  view.add(
    graphNodes.map((node, i) => (
      <Circle
        layout
        ref={makeRef(circles, i)}
        width={NODE_SIZE}
        height={NODE_SIZE}
        x={GRAPH_X_OFFSET + node.x}
        y={-400 + node.y}
        fill="#242424"
        stroke="#F3303F"
        lineWidth={10}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Txt
          fill="#FFFFFF"
          marginBottom={-10}
          fontWeight={800}
          fontSize={NODE_TEXT_SIZE}
          text={node.label}
          zIndex={2}
        />
      </Circle>
    )),
  );

  const edges: Line[] = [];

  view.add(
    graphEdges.map((edge, i) => {
      return (
        <Line
          ref={makeRef(edges, i)}
          stroke="#666"
          lineWidth={10}
          endArrow
          startOffset={5}
          endOffset={5}
          radius={80}
          points={() =>
            edge.points.map((point) => [
              point.x + GRAPH_X_OFFSET,
              point.y - 400,
            ])
          }
        />
      );
    }),
  );

  yield* circles.map(function* (circle) {
    yield circle.size(0);
    yield circle.opacity(0);
  });

  yield* edges.map(function* (edge) {
    yield edge.end(0.0001);
  });

  yield* waitFor(1);

  yield* sequence(
    0.2,
    ...circles.map(function* (circle) {
      yield* all(circle.opacity(1, 1), circle.size(NODE_SIZE, 1));
    }),
    ...edges.map(function* (edge) {
      yield* edge.end(1, 1);
    }),
  );

  yield* waitFor(1);
}
