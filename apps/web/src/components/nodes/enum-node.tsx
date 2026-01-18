'use client';

// ReactFlow node for Prisma enums
// Purple theme to distinguish from models (blue)

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { PrismaEnum } from '@prisma-uml/parser';

type EnumNodeData = { enum: PrismaEnum };
type EnumNodeType = Node<EnumNodeData, 'enum'>;

export const EnumNode = memo(function EnumNode({ data }: NodeProps<EnumNodeType>) {
  const enumDef = data.enum;
  const values = enumDef.values;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl min-w-50 max-w-65 overflow-hidden">
      <div className="bg-purple-600 px-4 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-300" />
        <span className="text-white font-semibold">{enumDef.name}</span>
        <span className="ml-auto text-purple-200 text-xs bg-purple-700/50 px-2 py-0.5 rounded">
          enum
        </span>
      </div>

      <div className="divide-y divide-zinc-800 max-h-62.5 overflow-y-auto">
        {enumDef.values.map((value, index) => (
          <div
            key={value.name}
            className="px-4 py-2 flex items-center justify-between text-sm hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs font-mono w-4">{index}</span>
              <span className="text-zinc-300">{value.name}</span>
            </div>
            {value.dbName && (
              <span className="text-zinc-500 text-xs font-mono">
                @map(&quot;{value.dbName}&quot;)
              </span>
            )}
          </div>
        ))}
      </div>

      {enumDef.documentation && (
        <div className="px-4 py-2 bg-zinc-800/50 text-xs text-zinc-500 border-t border-zinc-800">
          {enumDef.documentation}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-3! h-3! bg-purple-500! border-2! border-purple-300!"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-3! h-3! bg-purple-500! border-2! border-purple-300!"
      />
    </div>
  );
});
