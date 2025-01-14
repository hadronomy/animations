import cytoscape, { type SearchFirstResult } from 'cytoscape';
import dagre from 'cytoscape-dagre';

import {
  Circle,
  Line,
  Node,
  Txt,
  initial,
  signal,
  type Shape,
} from '@motion-canvas/2d';
import type { NodeProps, PossibleCanvasStyle, Rect } from '@motion-canvas/2d';
import {
  type SignalValue,
  type SimpleSignal,
  all,
  makeRef,
  sequence,
  easeInOutCubic,
} from '@motion-canvas/core';

// Define layout types supported by Cytoscape
type LayoutType = 'grid' | 'circle' | 'concentric' | 'breadthfirst' | 'cose' | 'dagre';

// Graph node structure with optional metadata
interface GraphNode {
  id: string;
  data?: Record<string, unknown>;
}

// Graph edge structure with optional weight
interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
}

// Required properties that must be provided to the graph
interface RequiredGraphProps {
  backgroundColor: SignalValue<PossibleCanvasStyle>;
}

// Optional properties with sensible defaults
interface OptionalGraphProps {
  nodeSize?: SignalValue<number>;
  nodeColor?: SignalValue<PossibleCanvasStyle>;
  edgeColor?: SignalValue<PossibleCanvasStyle>;
  textColor?: SignalValue<PossibleCanvasStyle>;
  layout?: LayoutType;
  animationDuration?: number;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  highlightColor?: SignalValue<PossibleCanvasStyle>;
  nodePadding?: number;
  edgeWidth?: number;
  arrowScale?: number;
  textScale?: number;
  fontSize?: number;
}

// Combine with NodeProps while maintaining correct optionality
export type GraphProps = RequiredGraphProps & OptionalGraphProps & NodeProps;

// Internal configuration type with all properties defined
type GraphConfiguration = {
  nodeSize: SignalValue<number>;
  nodeColor: SignalValue<PossibleCanvasStyle>;
  edgeColor: SignalValue<PossibleCanvasStyle>;
  textColor: SignalValue<PossibleCanvasStyle>;
  layout: LayoutType;
  animationDuration: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightColor: SignalValue<PossibleCanvasStyle>;
  nodePadding: number;
  edgeWidth: number;
  arrowScale: number;
  textScale: number;
  fontSize: number;
};

// Layout configuration options for each layout type
interface LayoutConfigs {
  [key: string]: Partial<cytoscape.LayoutOptions>;
}

export class Graph extends Node {
  @initial(120)
  @signal()
  public declare readonly nodeSize: SimpleSignal<number, this>;

  // Store visual elements
  private readonly nodes: Circle[] = [];
  private readonly edges: Line[] = [];
  private readonly labels: Txt[] = [];
  private readonly highlights: Shape[] = [];

  // Core graph management
  private readonly cy: cytoscape.Core;
  private currentLayout: LayoutType;
  private readonly config: GraphConfiguration;

  // Animation state
  private isAnimating = false;
  private props: GraphProps;

  public constructor(props: GraphProps) {
    super(props);
    this.props = props;

    // Initialize configuration with defaults
    this.config = {
      nodeSize: props.nodeSize ?? 120,
      nodeColor: props.nodeColor ?? '#F3303F',
      edgeColor: props.edgeColor ?? '#666666',
      textColor: props.textColor ?? '#FFFFFF',
      layout: props.layout ?? 'cose',
      animationDuration: props.animationDuration ?? 1,
      highlightColor: props.highlightColor ?? '#00FF00',
      nodePadding: props.nodePadding ?? 2,
      edgeWidth: props.edgeWidth ?? 2,
      arrowScale: props.arrowScale ?? 0.1,
      textScale: props.textScale ?? 1,
      nodes: props.nodes ?? [
        { id: '1' }, { id: '2' }, { id: '3' },
        { id: '4' }, { id: '5' }, { id: '6' }, { id: '7' }
      ],
      edges: props.edges ?? [
        { source: '1', target: '4', weight: 1 },
        { source: '2', target: '3', weight: 2 },
        { source: '4', target: '5', weight: 1 },
        { source: '5', target: '2', weight: 3 },
        { source: '5', target: '3', weight: 2 },
        { source: '5', target: '6', weight: 1 },
        { source: '6', target: '1', weight: 2 },
        { source: '1', target: '7', weight: 1 }
      ],
      fontSize: props.fontSize ?? this.nodeSize() / 2.5 * (props.textScale ?? 1)
    };

    this.currentLayout = this.config.layout;

    cytoscape.use(dagre);

    // Initialize Cytoscape with configuration
    this.cy = cytoscape({
      headless: true,
      elements: {
        nodes: this.config.nodes.map(node => ({
          data: { id: node.id, ...node.data }
        })),
        edges: this.config.edges.map(edge => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            weight: edge.weight
          }
        }))
      }
    });

    this.applyLayout();
    this.createVisualElements();
  }

  private getLayoutConfig(layout: LayoutType): cytoscape.LayoutOptions {
    const baseConfig: cytoscape.LayoutOptions = {
      name: 'preset',
      animate: false,
      padding: this.config.nodePadding,
    };

    const layoutConfigs: LayoutConfigs = {
      cose: {
        name: 'cose',
        idealEdgeLength: () => this.nodeSize() * 2,
        nodeOverlap: 20,
        gravity: 1,
        randomize: true
      },
      grid: {
        name: 'grid',
        rows: undefined
      },
      dagre: {
        name: 'dagre',
      },
      circle: {
        name: 'circle'
      },
      concentric: {
        name: 'concentric',
        minNodeSpacing: this.nodeSize() * 1.5
      },
      breadthfirst: {
        name: 'breadthfirst',
        directed: true
      }
    };

    return { ...baseConfig, ...layoutConfigs[layout] };
  }

  private centerGraph(): void {
    const bb = this.cy.elements().boundingBox();
    
    const offsetX = -bb.x1 - bb.w/2;
    const offsetY = -bb.y1 - bb.h/2;
  
    this.cy.nodes().positions((node) => {
      const pos = node.position();
      return {
        x: pos.x + offsetX,
        y: pos.y + offsetY
      };
    });
  }

  private applyLayout(): void {
    const layout = this.cy.layout(this.getLayoutConfig(this.currentLayout));
    layout.run();
    this.centerGraph();
  }

  private createVisualElements(): void {
    const NODE_TEXT_SIZE = 

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
          fill={this.props.backgroundColor}
          stroke={this.config.nodeColor}
          lineWidth={this.config.edgeWidth}
          alignItems={'center'}
          justifyContent={'center'}
          opacity={0}
          scale={0}
        >
          <Txt
            ref={makeRef(this.labels, i)}
            fill={this.config.textColor}
            fontWeight={700}
            fontSize={this.config.fontSize}
            text={node.id()}
            zIndex={2}
          />
        </Circle>
      );
    });

    // Create edges
    this.cy.edges().forEach((edge, i) => {
      const sourcePos = edge.source().position();
      const targetPos = edge.target().position();
      
      this.add(
        <Line
          ref={makeRef(this.edges, i)}
          stroke={this.config.edgeColor}
          lineWidth={this.config.edgeWidth}
          endArrow
          arrowSize={20 * this.config.arrowScale}
          startOffset={this.nodeSize() / 2 + this.config.nodePadding}
          endOffset={this.nodeSize() / 2 + this.config.nodePadding}
          points={[[sourcePos.x, sourcePos.y], [targetPos.x, targetPos.y]]}
          end={0.0001}
        />
      );
    });
  }


  public *animateIn(duration?: number) {
    const totalDuration = duration ?? this.config.animationDuration;
    
    if (totalDuration === 0) {
        for (const circle of this.nodes) {
            circle.opacity(1);
            circle.scale(1);
        }
        for (const edge of this.edges) edge.end(1);
        return;
    }

    const nodesPortion = totalDuration * 0.5;
    const edgesPortion = totalDuration * 0.5;

    const nodeDelay = nodesPortion / this.nodes.length;
    const edgeDelay = edgesPortion / this.edges.length;

    yield* sequence(
        nodeDelay,
        ...this.nodes.map((circle) =>
            all(
                circle.opacity(1, nodeDelay, easeInOutCubic),
                circle.scale(1, nodeDelay, easeInOutCubic)
            )
        )
    );

    yield* sequence(
        edgeDelay,
        ...this.edges.map((edge) =>
            edge.end(1, edgeDelay, easeInOutCubic)
        )
    );
  }

  public *changeLayout(newLayout: LayoutType, duration?: number) {
    if (newLayout === this.currentLayout || this.isAnimating) return;

    this.isAnimating = true;
    const animDuration = duration ?? this.config.animationDuration;

    this.currentLayout = newLayout;
    this.applyLayout();

    // Animate nodes and edges to new positions
    yield* all(
      ...this.nodes.map((node, i) => {
        const position = this.cy.nodes()[i]?.position() ?? { x: 0, y: 0 };
        return all(
          node.x(position.x, animDuration, easeInOutCubic),
          node.y(position.y, animDuration, easeInOutCubic)
        );
      }),
      ...this.edges.map((edge, i) => {
        const sourcePos = this.cy.edges()[i]?.source().position();
        const targetPos = this.cy.edges()[i]?.target().position();
        return edge.points(
          [[sourcePos?.x ?? 0, sourcePos?.y ?? 0], [targetPos?.x ?? 0, targetPos?.y ?? 0]],
          animDuration,
          easeInOutCubic
        );
      })
    );

    this.isAnimating = false;
  }

  public *highlightPath(path: string[], duration?: number) {
    const animDuration = duration ?? this.config.animationDuration / 2;
    const pathSet = new Set(path);

    yield* all(
      ...this.nodes.map((node, i) => {
        const nodeId = this.cy.nodes()[i]?.id() ?? '';
        return node.stroke(
          pathSet.has(nodeId) ? this.config.highlightColor : this.config.nodeColor,
          animDuration,
          easeInOutCubic
        );
      }),
      // Highlight all edges between nodes in the path
      ...this.edges.map((edge, i) => {
        const cyEdge = this.cy.edges()[i];
        if (!cyEdge) return edge.stroke(this.config.edgeColor, animDuration, easeInOutCubic);
        const sourceId = cyEdge.source().id();
        const targetId = cyEdge.target().id();
        return edge.stroke(
          pathSet.has(sourceId) && pathSet.has(targetId) ? 
          this.config.highlightColor : 
          this.config.edgeColor,
          animDuration,
          easeInOutCubic
        );
      })
    );
  }

  public runBfs(startNode: string): SearchFirstResult {
    return this.cy.elements().bfs({
      root: `#${startNode}`,
      directed: true
    });
  }

  public *animateBFS(startNode: string, duration?: number) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const animDuration = duration ?? this.config.animationDuration / 3;
    const bfs = this.cy.elements().bfs({
      root: `#${startNode}`,
      directed: true
    });

    // Reset all nodes
    yield* all(
      ...this.nodes.map(node =>
        node.stroke(this.config.nodeColor, animDuration / 2)
      )
    );

    // Animate BFS traversal
    for (const node of bfs.path) {
      const index = this.cy.nodes().toArray().findIndex(n => n.id() === node.id());
      if (index !== -1) {
        const node = this.nodes[index];
        if (!node) continue;
        yield* all(
          node.stroke(this.config.highlightColor, animDuration / 2),
          node.scale(1.2, animDuration / 2),
          node.scale(1, animDuration / 2)
        );
      }
    }

    this.isAnimating = false;
  }

  public *highlightShortestPath(start: string, end: string, duration?: number) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const animDuration = duration ?? this.config.animationDuration / 2;
    const dijkstra = this.cy.elements().dijkstra({
      root: `#${start}`,
      directed: true,
      weight: (edge) => edge.data('weight') || 1
    });

    const pathNodes = dijkstra.pathTo(this.cy.$(`#${end}`));
    const path = pathNodes.map(node => node.id());

    yield* this.highlightPath(path, animDuration);

    this.isAnimating = false;
  }

  public *clearHighlights(duration?: number) {
    const animDuration = duration ?? this.config.animationDuration / 2;

    yield* all(
      ...this.nodes.map(node =>
        node.stroke(this.config.nodeColor, animDuration)
      ),
      ...this.edges.map(edge =>
        edge.stroke(this.config.edgeColor, animDuration)
      )
    );
  }
}