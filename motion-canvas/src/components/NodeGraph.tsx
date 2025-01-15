import {
  Circle,
  Line,
  Node,
  Txt,
  computed,
  initial,
  signal,
} from '@motion-canvas/2d';
import type {
  CanvasStyle,
  CanvasStyleSignal,
  NodeProps,
  PossibleCanvasStyle,
} from '@motion-canvas/2d';
import {
  type SignalValue,
  type SimpleSignal,
  all,
  makeRef,
  sequence,
  easeInOutCubic,
} from '@motion-canvas/core';

import cytoscape, { type SearchFirstResult } from 'cytoscape';

const LAYOUT_TYPES = [
  'cose',
  'grid',
  'circle',
  'concentric',
  'breadthfirst',
] as const;

/**
 * Layout types supported by `cytoscape`
 * @see https://js.cytoscape.org/#layouts
 */
export type LayoutType = (typeof LAYOUT_TYPES)[number];
export type DefaultLayoutType = (typeof LAYOUT_TYPES)[0];

/**
 * Graph node structure with optional data
 * Used to define nodes in the graph
 */
interface GraphNode {
  id: string;
  data?: Record<string, unknown>;
}

/**
 * Graph edge structure with optional weight
 * Used to define edges in the graph
 */
interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
}

// Required properties that must be provided to the graph
interface RequiredGraphProps {
  backgroundColor: SignalValue<PossibleCanvasStyle>;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Optional properties with sensible defaults
interface OptionalGraphProps {
  nodeSize?: SignalValue<number>;
  nodeColor?: SignalValue<PossibleCanvasStyle>;
  edgeColor?: SignalValue<PossibleCanvasStyle>;
  textColor?: SignalValue<PossibleCanvasStyle>;
  layout?: LayoutType;
  animationDuration?: number;
  highlightColor?: SignalValue<PossibleCanvasStyle>;
  nodePadding?: number;
  edgeWidth?: number;
  arrowScale?: number;
  textScale?: number;
  fontSize?: number;
}

// Combine with NodeProps while maintaining correct optionality
export type GraphProps = RequiredGraphProps & OptionalGraphProps & NodeProps;

// Layout configuration options for each layout type
interface LayoutConfigs {
  [key: string]: Partial<cytoscape.LayoutOptions>;
}

export class Graph extends Node {
  @initial(120)
  @signal()
  public declare readonly nodeSize: SimpleSignal<number, this>;

  @initial('#F3303F')
  @signal()
  public declare readonly nodeColor: CanvasStyleSignal<this>;

  @initial('transparent')
  @signal()
  public declare readonly backgroundColor: CanvasStyleSignal<this>;

  @initial('#666666')
  @signal()
  public declare readonly edgeColor: CanvasStyleSignal<this>;

  @initial('#FFFFFF')
  @signal()
  public declare readonly textColor: CanvasStyleSignal<this>;

  @initial('cose')
  @signal()
  public declare readonly layout: SimpleSignal<LayoutType, this>;

  @initial('#00FF00')
  @signal()
  public declare readonly highlightColor: CanvasStyleSignal<this>;

  @initial(0.25)
  @signal()
  public declare readonly nodePadding: SimpleSignal<number, this>;

  @initial(2)
  @signal()
  public declare readonly edgeWidth: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  public declare readonly arrowScale: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  public declare readonly textScale: SimpleSignal<number, this>;

  @signal()
  public declare readonly fontSize: SimpleSignal<number, this>;

  // Store visual elements
  private readonly nodes: Circle[] = [];
  private readonly edges: Line[] = [];
  private readonly labels: Txt[] = [];

  // Core graph management
  private readonly cy: cytoscape.Core;

  // Animation state
  private isAnimating = false;

  public constructor(props: GraphProps) {
    super(props);

    // Initialize signals only for defined props
    if (props.nodeSize !== undefined) this.nodeSize(props.nodeSize);
    if (props.nodeColor !== undefined) this.nodeColor(props.nodeColor);
    if (props.edgeColor !== undefined) this.edgeColor(props.edgeColor);
    if (props.textColor !== undefined) this.textColor(props.textColor);
    if (props.layout !== undefined) this.layout(props.layout);
    if (props.highlightColor !== undefined)
      this.highlightColor(props.highlightColor);
    if (props.nodePadding !== undefined) this.nodePadding(props.nodePadding);
    if (props.edgeWidth !== undefined) this.edgeWidth(props.edgeWidth);
    if (props.arrowScale !== undefined) this.arrowScale(props.arrowScale);
    if (props.textScale !== undefined) this.textScale(props.textScale);
    if (props.fontSize !== undefined) {
      this.fontSize(props.fontSize);
    } else {
      this.fontSize((this.nodeSize() / 2.5) * (this.textScale() ?? 1));
    }

    this.cy = cytoscape({
      headless: true,
      elements: {
        nodes: props.nodes.map((node) => ({
          data: { id: node.id, ...node.data },
        })),
        edges: props.edges.map((edge) => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            weight: edge.weight,
          },
        })),
      },
    });

    this.applyLayout();
    this.createVisualElements();
  }

  public *animateIn(duration = 1) {
    if (duration === 0) {
      for (const circle of this.nodes) {
        circle.opacity(1);
        circle.scale(1);
      }
      for (const edge of this.edges) edge.end(1);
      return;
    }

    const nodesPortion = duration * 0.5;
    const edgesPortion = duration * 0.5;

    const nodeDelay = nodesPortion / this.nodes.length;
    const edgeDelay = edgesPortion / this.edges.length;

    yield* sequence(
      nodeDelay,
      ...this.nodes.map((circle) =>
        all(
          circle.opacity(1, nodeDelay, easeInOutCubic),
          circle.scale(1, nodeDelay, easeInOutCubic),
        ),
      ),
    );

    yield* sequence(
      edgeDelay,
      ...this.edges.map((edge) => edge.end(1, edgeDelay, easeInOutCubic)),
    );
  }

  public *stabilizedRotation(degrees: number, duration = 1) {
    yield* all(
      this.rotation(degrees, duration, easeInOutCubic),
      ...this.nodes.map((node) =>
        node.rotation(-degrees, duration, easeInOutCubic),
      ),
    );
  }

  public *changeLayout(newLayout: LayoutType, duration = 1) {
    if (newLayout === this.layout() || this.isAnimating) return;

    this.isAnimating = true;
    this.layout(newLayout);
    this.applyLayout();

    // Animate nodes and edges to new positions
    yield* all(
      ...this.nodes.map((node, i) => {
        const position = this.cy.nodes()[i]?.position() ?? { x: 0, y: 0 };
        return all(
          node.x(position.x, duration, easeInOutCubic),
          node.y(position.y, duration, easeInOutCubic),
        );
      }),
      ...this.edges.map((edge, i) => {
        const sourcePos = this.cy.edges()[i]?.source().position();
        const targetPos = this.cy.edges()[i]?.target().position();
        return edge.points(
          [
            [sourcePos?.x ?? 0, sourcePos?.y ?? 0],
            [targetPos?.x ?? 0, targetPos?.y ?? 0],
          ],
          duration,
          easeInOutCubic,
        );
      }),
    );

    this.isAnimating = false;
  }

  public *highlightPath(path: string[], targetNode?: string, duration = 0.5) {
    const endNode = targetNode ?? path[path.length - 1];

    // Backtrack from the target node to the start node
    let current = endNode;
    if (!current) return;
    const backtrace: string[] = [current];

    while (current) {
      const currentIndex = path.indexOf(current);
      if (currentIndex <= 0) break; // No more nodes to backtrack

      const edgeElement = path[currentIndex - 1];
      const incomingEdge = this.cy
        .edges()
        .filter((edge) => edge.id() === edgeElement)
        .first();

      if (!incomingEdge || !incomingEdge.isEdge()) break;

      backtrace.unshift(incomingEdge.id());
      const previousNodeId = incomingEdge.source().id();
      backtrace.unshift(previousNodeId);
      current = previousNodeId;
    }

    // Extract nodes and edges from the backtraced path
    const nodes = backtrace.filter((id) => !id.includes('-'));
    const edges = backtrace.filter((id) => id.includes('-'));

    yield* all(
      ...this.nodes.map((node, i) => {
        const nodeId = this.cy.nodes()[i]?.id() ?? '';
        return node.stroke(
          nodes.includes(nodeId) ? this.highlightColor() : this.nodeColor(),
          duration,
          easeInOutCubic,
        );
      }),
      ...this.edges.map((edge, i) => {
        const edgeId = this.cy.edges()[i]?.id() ?? '';
        return edge.stroke(
          edges.includes(edgeId) ? this.highlightColor : this.edgeColor(),
          duration,
          easeInOutCubic,
        );
      }),
    );
  }

  public runBfs(startNode: string): SearchFirstResult {
    return this.cy.elements().bfs({
      root: `#${startNode}`,
      directed: true,
    });
  }

  public *animateBFS(startNode: string, duration = 0.3) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const bfs = this.runBfs(startNode);
    const discovered = new Set<string>();
    const traversedEdges = new Set<string>();

    // Reset all nodes and edges
    yield* all(
      ...this.nodes.map((node) => node.stroke(this.nodeColor(), duration / 2)),
      ...this.edges.map((edge) => edge.stroke(this.edgeColor(), duration / 2)),
    );

    // Animate BFS traversal
    for (const node of bfs.path) {
      const nodeId = node.id();
      discovered.add(nodeId);

      // Find and highlight edges to this node
      for (const edge of this.cy.edges()) {
        if (
          discovered.has(edge.source().id()) &&
          edge.target().id() === nodeId
        ) {
          const edgeIndex = this.cy
            .edges()
            .toArray()
            .findIndex((e) => e.id() === edge.id());
          if (edgeIndex !== -1) {
            traversedEdges.add(edge.id());
            const edgeElement = this.edges[edgeIndex];
            if (edgeElement) {
              yield* edgeElement.stroke(this.highlightColor, duration / 2);
            }
          }
        }
      }

      // Highlight the current node
      const index = this.cy
        .nodes()
        .toArray()
        .findIndex((n) => n.id() === nodeId);
      if (index !== -1) {
        const nodeElement = this.nodes[index];
        if (!nodeElement) continue;
        yield* all(
          nodeElement.stroke(this.highlightColor, duration / 2),
          nodeElement.scale(1.2, duration / 2),
          nodeElement.scale(1, duration / 2),
        );
      }
    }

    this.isAnimating = false;
  }

  public *clearHighlights(duration = 0.5) {
    yield* all(
      ...this.nodes.map((node) => node.stroke(this.nodeColor(), duration)),
      ...this.edges.map((edge) => edge.stroke(this.edgeColor(), duration)),
    );
  }

  private getLayoutConfig(layout: LayoutType): cytoscape.LayoutOptions {
    const baseConfig: cytoscape.LayoutOptions = {
      name: 'preset',
      animate: false,
    };

    const layoutConfigs: LayoutConfigs = {
      cose: {
        name: 'cose',
        idealEdgeLength: () => this.nodeSize() * 2,
        nodeOverlap: this.nodeSize() * 4,
        gravity: 1,
        randomize: false,
      },
      grid: {
        name: 'grid',
        rows: undefined,
      },
      dagre: {
        name: 'dagre',
      },
      circle: {
        name: 'circle',
      },
      concentric: {
        name: 'concentric',
        minNodeSpacing: this.nodeSize() * 1.5,
      },
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
      },
    };

    return { ...baseConfig, ...layoutConfigs[layout] };
  }

  private centerGraph(): void {
    const bb = this.cy.elements().boundingBox();

    const offsetX = -bb.x1 - bb.w / 2;
    const offsetY = -bb.y1 - bb.h / 2;

    this.cy.nodes().positions((node) => {
      const pos = node.position();
      return {
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      };
    });
  }

  private applyLayout(): void {
    this.cy.layout(this.getLayoutConfig('grid')).run();
    const layout = this.cy.layout(this.getLayoutConfig(this.layout()));
    layout.run();
    this.centerGraph();
  }

  private createVisualElements(): void {
    // Create nodes with labels
    this.cy.nodes().forEach((node, i) => {
      const position = node.position();

      // Create node circle
      this.add(
        <Circle
          layout
          ref={makeRef(this.nodes, i)}
          width={this.nodeSize}
          height={this.nodeSize}
          x={position.x}
          y={position.y}
          fill={this.backgroundColor}
          stroke={this.nodeColor}
          lineWidth={this.edgeWidth}
          alignItems={'center'}
          justifyContent={'center'}
          opacity={0}
          scale={0}
        >
          <Txt
            ref={makeRef(this.labels, i)}
            fill={this.textColor}
            fontWeight={700}
            fontSize={this.fontSize}
            text={node.id()}
            zIndex={2}
          />
        </Circle>,
      );
    });

    // Create edges
    this.cy.edges().forEach((edge, i) => {
      const sourcePos = edge.source().position();
      const targetPos = edge.target().position();

      this.add(
        <Line
          ref={makeRef(this.edges, i)}
          stroke={this.edgeColor}
          lineWidth={this.edgeWidth}
          endArrow
          arrowSize={20 * this.arrowScale()}
          startOffset={
            this.nodeSize() / 2 + this.nodePadding() * this.nodeSize()
          }
          endOffset={this.nodeSize() / 2 + this.nodePadding() * this.nodeSize()}
          points={[
            [sourcePos.x, sourcePos.y],
            [targetPos.x, targetPos.y],
          ]}
          end={0.0001}
        />,
      );
    });
  }
}
