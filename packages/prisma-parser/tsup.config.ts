import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'renderers/mermaid': 'src/renderers/mermaid.ts',
    'renderers/plantuml': 'src/renderers/plantuml.ts',
    'renderers/dbml': 'src/renderers/dbml.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
