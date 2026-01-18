'use client';

// Custom ReactFlow node for Prisma models
// Shows fields with their types and various indicators (PK, FK, unique, etc)

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { PrismaModel, PrismaField } from '@prisma-uml/parser';
import {
  KeyIcon,
  LinkIcon,
  ListBulletIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

type ModelNodeData = { model: PrismaModel };
type ModelNodeType = Node<ModelNodeData, 'model'>;

export const ModelNode = memo(function ModelNode({ data }: NodeProps<ModelNodeType>) {
  const { model } = data;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl min-w-70 max-w-80 overflow-visible relative">
      <div className="bg-blue-600 px-4 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-300" />
          <span className="text-white font-semibold">{model.name}</span>
        </div>
        {model.dbName && (
          <span className="text-blue-200 text-xs bg-blue-700/50 px-2 py-0.5 rounded">
            {model.dbName}
          </span>
        )}
      </div>

      <div className="divide-y divide-zinc-800 max-h-75 overflow-y-auto">
        {model.fields.map((field) => (
          <FieldRow key={field.name} field={field} />
        ))}
      </div>

      {model.primaryKey && (
        <div className="px-4 py-2 bg-zinc-800/50 text-xs text-zinc-500 rounded-b-lg">
          Composite PK: {model.primaryKey.fields.join(', ')}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-3! h-3! bg-blue-500! border-2! border-blue-300!"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-3! h-3! bg-blue-500! border-2! border-blue-300!"
      />
    </div>
  );
});

// individual field row with icons and badges
function FieldRow({ field }: { field: PrismaField }) {
  const isRelation = field.kind === 'object';

  // build the type string (e.g., "User[]" or "String?")
  let typeStr = field.type;
  if (field.isList) typeStr += '[]';
  else if (!field.isRequired) typeStr += '?';

  return (
    <div className="px-4 py-2 flex items-center justify-between text-sm hover:bg-zinc-800/50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          {field.isId && <KeyIcon className="w-4 h-4 text-yellow-500" title="Primary Key" />}
          {isRelation && <LinkIcon className="w-4 h-4 text-blue-400" title="Relation" />}
          {field.isList && <ListBulletIcon className="w-4 h-4 text-green-400" title="Array" />}
          {!field.isRequired && !field.isId && (
            <QuestionMarkCircleIcon className="w-4 h-4 text-zinc-500" title="Optional" />
          )}
        </div>

        <span
          className={`truncate ${field.isId ? 'font-semibold text-yellow-400' : 'text-zinc-300'}`}
        >
          {field.name}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className={`font-mono text-xs ${isRelation ? 'text-blue-400' : 'text-zinc-500'}`}>
          {typeStr}
        </span>

        {field.isUnique && !field.isId && (
          <span className="px-1.5 py-0.5 text-2.5 bg-purple-500/20 text-purple-400 rounded font-medium">
            UK
          </span>
        )}

        {field.isOmitted && (
          <span className="px-1.5 py-0.5 text-2.5 bg-orange-500/20 text-orange-400 rounded font-medium">
            omit
          </span>
        )}
      </div>
    </div>
  );
}
