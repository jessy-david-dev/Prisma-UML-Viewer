'use client';

// Toolbar above the diagram showing schema stats

import type { PrismaSchema } from '@prisma-uml/parser';
import { CubeIcon, RectangleStackIcon, CircleStackIcon } from '@heroicons/react/24/outline';

interface DiagramControlsProps {
  schema: PrismaSchema | null;
}

export function DiagramControls({ schema }: DiagramControlsProps) {
  // show a minimal bar when no schema is loaded
  if (!schema) {
    return (
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-4 text-zinc-500 text-sm">
          <span>UML Diagram</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-zinc-400">UML Diagram</h2>
          <div className="h-4 w-px bg-zinc-700" />
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <CircleStackIcon className="w-4 h-4" />
            Prisma {schema.version}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <CubeIcon className="w-4 h-4 text-blue-400" />
            {schema.models.length} models
          </span>
          {schema.enums.length > 0 && (
            <span className="flex items-center gap-1.5">
              <RectangleStackIcon className="w-4 h-4 text-purple-400" />
              {schema.enums.length} enums
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
