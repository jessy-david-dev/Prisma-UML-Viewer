'use client';

import { useCallback } from 'react';
import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  baseNodeHeight?: number;
  fieldHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

function calculateNodeHeight(node: Node, baseHeight: number, fieldHeight: number): number {
  const data = node.data as { model?: { fields?: unknown[] }; enum?: { values?: unknown[] } };

  if (data.model?.fields) {
    const fieldsCount = data.model.fields.length;
    return Math.max(baseHeight, 52 + fieldsCount * 36 + 16);
  }

  if (data.enum?.values) {
    const valuesCount = data.enum.values.length;
    return Math.max(baseHeight, 44 + valuesCount * 32 + 16);
  }

  return baseHeight;
}

export function useAutoLayout() {
  const getLayoutedElements = useCallback(
    (
      nodes: Node[],
      edges: Edge[],
      options: LayoutOptions = {}
    ): { nodes: Node[]; edges: Edge[] } => {
      const {
        direction = 'LR',
        nodeWidth = 300,
        baseNodeHeight = 150,
        fieldHeight = 36,
        rankSep = 100,
        nodeSep = 50,
      } = options;

      const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

      g.setGraph({
        rankdir: direction,
        ranksep: rankSep,
        nodesep: nodeSep,
        marginx: 50,
        marginy: 50,
      });

      const nodeHeights = new Map<string, number>();

      nodes.forEach((node) => {
        const height = calculateNodeHeight(node, baseNodeHeight, fieldHeight);
        nodeHeights.set(node.id, height);

        g.setNode(node.id, {
          width: nodeWidth,
          height: height,
        });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      Dagre.layout(g);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        const height = nodeHeights.get(node.id) || baseNodeHeight;

        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - height / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
}
