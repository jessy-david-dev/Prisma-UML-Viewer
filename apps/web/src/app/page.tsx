'use client';

// Main page component
import { useState, useCallback } from 'react';
import { SchemaEditor } from '@/components/schema-editor';
import { UMLDiagram } from '@/components/uml-diagram';
import { DiagramControls } from '@/components/diagram-controls';
import { ExportButtons } from '@/components/export-buttons';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { PrismaSchema } from '@prisma-uml/parser';

// I went with 40% for the editor panel, feels like a good balance
const DEFAULT_PANEL_SIZE = 40;
const MIN_PANEL = 20;
const MAX_PANEL = 80;

export default function HomePage() {
  const [schema, setSchema] = useState<PrismaSchema | null>(null);
  const [rawSchema, setRawSchema] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [panelSize, setPanelSize] = useState(DEFAULT_PANEL_SIZE);
  const [isResizing, setIsResizing] = useState(false);

  // when parsing succeeds, update both the parsed schema and raw text
  const handleSchemaChange = useCallback((parsedSchema: PrismaSchema, raw: string) => {
    setSchema(parsedSchema);
    setRawSchema(raw);
    setError(null); // clear any previous errors
  }, []);

  // if there's an error, we still want to show it but clear the diagram
  const handleError = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage) setSchema(null);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // drag handler for the resizable divider
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing) return;

      const container = e.currentTarget as HTMLElement;
      const rect = container.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;

      // clamp to reasonable bounds so panels don't get too small
      const clamped = Math.min(Math.max(percentage, MIN_PANEL), MAX_PANEL);
      setPanelSize(clamped);
    },
    [isResizing]
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header>
        <ExportButtons schema={schema} rawSchema={rawSchema} />
      </Header>

      <main
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Editor Panel */}
        <div
          className="border-r border-zinc-800 overflow-hidden flex flex-col"
          style={{ width: `${panelSize}%` }}
        >
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-sm font-medium text-zinc-400">Prisma Schema</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <SchemaEditor onSchemaChange={handleSchemaChange} onError={handleError} />
          </div>
        </div>

        {/* Resizer */}
        <div
          className={`w-1 cursor-col-resize transition-colors ${
            isResizing ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-blue-600'
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Diagram Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DiagramControls schema={schema} />

          {error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <h3 className="text-red-400 font-medium mb-2">Parsing Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <UMLDiagram schema={schema} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
