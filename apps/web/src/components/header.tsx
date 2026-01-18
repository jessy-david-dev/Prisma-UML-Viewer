// Site header with branding and nav links

import type { ReactNode } from 'react';
import { SiPrisma } from '@icons-pack/react-simple-icons';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
      {/* logo + title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <SiPrisma className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold text-white">Prisma UML Viewer</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full font-medium">
            v5/v6/v7
          </span>
          <span className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">beta</span>
        </div>
      </div>

      {/* right side: docs link + export buttons */}
      <div className="flex items-center gap-4">
        <a
          href="https://www.prisma.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Documentation Prisma
        </a>
        {children}
      </div>
    </header>
  );
}
