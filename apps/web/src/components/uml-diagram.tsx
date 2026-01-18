'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

import { ModelNode } from './nodes/model-node';
import { EnumNode } from './nodes/enum-node';
import { useAutoLayout } from '../hooks';
import type { PrismaSchema } from '@prisma-uml/parser';

// custom node types for models and enums
const nodeTypes = {
  model: ModelNode,
  enum: EnumNode,
} as const;

interface UMLDiagramProps {
  schema: PrismaSchema | null;
}

// wrapper component to provide ReactFlow context
export function UMLDiagram({ schema }: UMLDiagramProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvas schema={schema} />
    </ReactFlowProvider>
  );
}

// the actual diagram logic lives here
function DiagramCanvas({ schema }: UMLDiagramProps) {
  const [mounted, setMounted] = useState(false);
  const { fitView } = useReactFlow();
  const { getLayoutedElements } = useAutoLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!schema) return { nodes: [], edges: [] };
    return schemaToReactFlow(schema);
  }, [schema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (schema) {
      const { nodes: newNodes, edges: newEdges } = schemaToReactFlow(schema);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [schema, setNodes, setEdges]);

  // auto-layout using dagre - tweaked these values until it looked good
  const onAutoLayout = useCallback(() => {
    const layoutConfig = {
      direction: 'LR' as const,
      nodeWidth: 300,
      baseNodeHeight: 150,
      fieldHeight: 36,
      rankSep: 80, // space between columns
      nodeSep: 30, // space between nodes in same column
    };

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      layoutConfig
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // small delay before fitting view, otherwise it doesn't work properly
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges, fitView]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900">
        <div className="text-zinc-500">Loading diagram...</div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900">
        <div className="text-center text-zinc-500">
          <p className="text-lg mb-2">No schema to display</p>
          <p className="text-sm">Enter a valid Prisma schema in the editor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-zinc-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#3f3f46" gap={50} variant={BackgroundVariant.Lines} lineWidth={1} />
        <Controls className="bg-zinc-800! border-zinc-700! shadow-lg!" showInteractive={false} />
        <MiniMap
          nodeStrokeColor="#3b82f6"
          nodeColor="#18181b"
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-zinc-800! border-zinc-700!"
        />
        <Panel position="top-left" className="flex gap-2">
          <button
            onClick={onAutoLayout}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors shadow-lg"
            title="Automatically organize the diagram layout"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
            <span>Auto-organize</span>
          </button>
        </Panel>
        <Panel position="top-right" className="text-xs text-zinc-500">
          {schema.models.length} models • {schema.enums.length} enums
        </Panel>
      </ReactFlow>
    </div>
  );
}

function schemaToReactFlow(schema: PrismaSchema): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const GRID_COLS = Math.min(3, Math.ceil(Math.sqrt(schema.models.length + schema.enums.length)));
  const NODE_WIDTH = 300;
  const NODE_HEIGHT = 250;
  const GAP_X = 120;
  const GAP_Y = 100;

  schema.models.forEach((model, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);

    nodes.push({
      id: model.name,
      type: 'model',
      position: {
        x: col * (NODE_WIDTH + GAP_X),
        y: row * (NODE_HEIGHT + GAP_Y),
      },
      data: { model },
    });

    model.fields
      .filter((field) => field.kind === 'object' && field.relationFromFields?.length)
      .forEach((field) => {
        const targetModel = field.type.replace('[]', '').replace('?', '');

        edges.push({
          id: `${model.name}-${field.name}-${targetModel}`,
          source: model.name,
          target: targetModel,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
          style: {
            stroke: '#3b82f6',
            strokeWidth: 2,
          },
          label: field.relationName || undefined,
          labelStyle: {
            fill: '#a1a1aa',
            fontSize: 11,
            fontWeight: 500,
          },
          labelBgStyle: {
            fill: '#18181b',
            fillOpacity: 0.9,
          },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 4,
        });
      });
  });

  schema.enums.forEach((enumDef, index) => {
    const totalModels = schema.models.length;
    const enumIndex = totalModels + index;
    const col = enumIndex % GRID_COLS;
    const row = Math.floor(enumIndex / GRID_COLS);

    nodes.push({
      id: enumDef.name,
      type: 'enum',
      position: {
        x: col * (NODE_WIDTH + GAP_X),
        y: row * (NODE_HEIGHT + GAP_Y),
      },
      data: { enum: enumDef },
    });
  });

  return { nodes, edges };
}
