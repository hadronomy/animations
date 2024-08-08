import { graphlib, layout } from '@dagrejs/dagre';
import {
  Circle,
  Line,
  Node,
  type NodeProps,
  Txt,
  initial,
  signal,
} from '@motion-canvas/2d';
import {
  type SignalValue,
  type SimpleSignal,
  all,
  makeRef,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export interface GraphProps extends NodeProps {
  nodeSize?: SignalValue<number>;
}

export class Graph extends Node {
  @initial(120)
  @signal()
  public declare readonly nodeSize: SimpleSignal<number, this>;

  private nodes: Circle[] = [];
  private edges: Line[] = [];

  public constructor(props?: GraphProps) {
    super({ ...props });

    const graph = new graphlib.Graph();
    graph.setGraph({});
    graph.setDefaultEdgeLabel(() => ({}));

    const GRAPH_X_OFFSET = -500;
    const NODE_TEXT_RELATION = 2.18;
    const NODE_TEXT_SIZE = this.nodeSize() / NODE_TEXT_RELATION;

    graph.setNode('1', {
      label: '1',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('2', {
      label: '2',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('3', {
      label: '3',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('4', {
      label: '4',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('5', {
      label: '5',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('6', {
      label: '6',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });
    graph.setNode('7', {
      label: '7',
      width: this.nodeSize(),
      height: this.nodeSize(),
    });

    graph.setEdge('1', '4');
    graph.setEdge('2', '3');
    graph.setEdge('4', '5');
    graph.setEdge('5', '2');
    graph.setEdge('5', '3');
    graph.setEdge('5', '6');
    graph.setEdge('6', '1');
    graph.setEdge('1', '7');

    layout(graph);
    const graphNodes = graph.nodes().map((node) => graph.node(node));
    const graphEdges = graph.edges().map((edge) => graph.edge(edge));

    waitUntil('event');
    // Create some rects
    this.add(
      graphNodes.map((node, i) => (
        <Circle
          layout
          ref={makeRef(this.nodes, i)}
          width={this.nodeSize}
          height={this.nodeSize}
          x={GRAPH_X_OFFSET + node.x}
          y={-400 + node.y}
          fill="#242424"
          stroke="#F3303F"
          lineWidth={10}
          alignItems={'center'}
          justifyContent={'center'}
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

    this.add(
      graphEdges.map((edge, i) => {
        return (
          <Line
            ref={makeRef(this.edges, i)}
            stroke="#666"
            lineWidth={10}
            endArrow
            arrowSize={20}
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
  }

  public *animateIn() {
    yield* this.nodes.map(function* (circle) {
      yield circle.scale(0);
      yield circle.opacity(0);
    });

    yield* this.edges.map(function* (edge) {
      yield edge.end(0.0001);
    });

    yield* sequence(
      0.2,
      ...this.nodes.map(function* (circle) {
        yield* all(circle.opacity(1, 1), circle.scale(1, 1));
      }),
      ...this.edges.map(function* (edge) {
        yield* edge.end(1, 1);
      }),
    );
  }
}
