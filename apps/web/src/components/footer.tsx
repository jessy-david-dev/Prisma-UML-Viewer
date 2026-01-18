// Simple footer with GitHub link and credits

import { SiGithub } from '@icons-pack/react-simple-icons';
import packageJson from '../../package.json';

export function Footer() {
  return (
    <footer className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
      {/* repo link */}
      <div className="flex items-center gap-4 text-xs">
        <a
          href="https://github.com/jessy-david-dev/Prisma-UML-Viewer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <SiGithub className="w-4 h-4" />
          GitHub
        </a>
        <img
          src={`https://img.shields.io/badge/version-${packageJson.version}-green`}
          alt={`Version ${packageJson.version}`}
          className="h-5"
        />
      </div>

      <span className="text-zinc-600 text-xs">
        A tool by{' '}
        <a
          href="https://jessy-david.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Jessy DAVID
        </a>
      </span>
    </footer>
  );
}
