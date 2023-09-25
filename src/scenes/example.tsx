import { makeScene2D, Circle, Line, Txt, Layout } from '@motion-canvas/2d';
import { CodeBlock } from '@motion-canvas/2d/lib/components/CodeBlock';
import { all, waitFor, makeRef, sequence, useLogger, createRef } from '@motion-canvas/core';
import { graphlib, layout } from '@dagrejs/dagre';

const GRAPH_X_OFFSET = -500;

export default makeScene2D(function* (view) {
  const logger = useLogger();

  var graph = new graphlib.Graph();
  graph.setGraph({});
  graph.setDefaultEdgeLabel(function() { return {}; });

  graph.setNode('1', { label: '1', width: 120, height: 120 });
  graph.setNode('2', { label: '2', width: 120, height: 120 });
  graph.setNode('3', { label: '3', width: 120, height: 120 });
  graph.setNode('4', { label: '4', width: 120, height: 120 });
  graph.setNode('5', { label: '5', width: 120, height: 120 });

  graph.setEdge('1', '4');
  graph.setEdge('2', '3');
  graph.setEdge('3', '4');
  graph.setEdge('4', '5');
  graph.setEdge('5', '2');
  graph.setEdge('5', '1');
  graph.setEdge('5', '3');

  yield layout(graph);
  const graphNodes = graph.nodes().map(node => graph.node(node));
  const graphEdges = graph.edges().map(edge => graph.edge(edge));

  const circles: Circle[] = [];
  // Create some rects
  view.add(
    graphNodes.map((node, i) => (
      <Circle
        layout
        ref={makeRef(circles, i)}
        width={120}
        height={120}
        x={GRAPH_X_OFFSET + node.x}
        y={-400 + node.y}
        fill="#242424"
        stroke="#F3303F"
        lineWidth={10}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Txt fill="#FFFFFF" marginBottom={-10} fontWeight={800} fontSize={55} text={node.label} zIndex={2} />
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
          points={() => edge.points.map(point => ([point.x + GRAPH_X_OFFSET, point.y - 400]))}
        />
      )
    }),
  )

  const codeBlock = createRef<CodeBlock>();

  view.add(<CodeBlock ref={codeBlock} x={500} language='ts' code={`
  var graph = new graphlib.Graph();
  graph.setGraph({});
  `} 
  />)

  yield* circles.map(function*(circle) {
    yield circle.size(0);
    yield circle.opacity(0);
  });

  yield* edges.map(function*(edge) {
    yield edge.end(0.0001);
  });

  yield* waitFor(1);

  yield* sequence(0.2,
    ...circles.map(function*(circle) {
      yield* all(circle.opacity(1, 1), circle.size(120, 1));
    }),
    ...edges.map(function*(edge) { 
      yield* edge.end(1, 1);
    })
  );
  
  // yield* waitFor(1);
  
  yield* waitFor(10);
  
});
