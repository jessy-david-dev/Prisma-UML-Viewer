'use client';

import { useState, useCallback } from 'react';
import type { PrismaSchema } from '@prisma-uml/parser';
import {
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useExportImage, type ImageFormat } from '@/hooks/use-export-image';

type ExportFormat = 'mermaid' | 'plantuml' | 'dbml';

interface ExportButtonsProps {
  schema: PrismaSchema | null;
  rawSchema: string;
}

export function ExportButtons({ schema, rawSchema }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { downloadImage } = useExportImage();

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      if (!rawSchema) return;

      setIsExporting(true);
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema: rawSchema, format }),
        });

        const result = await response.json();

        if (result.success) {
          await navigator.clipboard.writeText(result.output);
          setCopiedFormat(format);
          setTimeout(() => setCopiedFormat(null), 2000);
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
        setShowDropdown(false);
      }
    },
    [rawSchema]
  );

  const downloadAs = useCallback(
    async (format: ExportFormat) => {
      if (!rawSchema) return;

      setIsExporting(true);
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema: rawSchema, format }),
        });

        const result = await response.json();

        if (result.success) {
          const extensions: Record<ExportFormat, string> = {
            mermaid: 'mmd',
            plantuml: 'puml',
            dbml: 'dbml',
          };

          const blob = new Blob([result.output], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `schema.${extensions[format]}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Download failed:', error);
      } finally {
        setIsExporting(false);
        setShowDropdown(false);
      }
    },
    [rawSchema]
  );

  const downloadImageAs = useCallback(
    async (format: ImageFormat) => {
      setIsExporting(true);
      try {
        await downloadImage({
          format,
          filename: 'prisma-diagram',
          backgroundColor: '#18181b',
        });
      } catch (error) {
        console.error('Image export failed:', error);
      } finally {
        setIsExporting(false);
        setShowDropdown(false);
      }
    },
    [downloadImage]
  );

  if (!schema) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span>Export</span>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2">
              <p className="text-xs text-zinc-500 px-2 py-1 mb-1">Copy to clipboard</p>
              {(['mermaid', 'plantuml', 'dbml'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => exportAs(format)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                >
                  {copiedFormat === format ? (
                    <CheckIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  )}
                  <span className="capitalize">{format}</span>
                  {copiedFormat === format && (
                    <span className="ml-auto text-xs text-green-400">Copied!</span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-700 p-2">
              <p className="text-xs text-zinc-500 px-2 py-1 mb-1">Download Code</p>
              {(['mermaid', 'plantuml', 'dbml'] as ExportFormat[]).map((format) => (
                <button
                  key={`download-${format}`}
                  onClick={() => downloadAs(format)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="capitalize">{format}</span>
                  <span className="ml-auto text-xs text-zinc-500">
                    .{format === 'mermaid' ? 'mmd' : format === 'plantuml' ? 'puml' : 'dbml'}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-700 p-2">
              <p className="text-xs text-zinc-500 px-2 py-1 mb-1">Download Image</p>
              {(['png', 'svg', 'jpeg'] as ImageFormat[]).map((format) => (
                <button
                  key={`image-${format}`}
                  onClick={() => downloadImageAs(format)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                >
                  <PhotoIcon className="w-4 h-4" />
                  <span className="uppercase">{format}</span>
                  <span className="ml-auto text-xs text-zinc-500">.{format}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
