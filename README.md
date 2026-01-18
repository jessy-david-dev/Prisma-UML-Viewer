# Prisma UML Viewer

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

Visualize your Prisma schemas as interactive ERD diagrams.

## Features

- Real-time schema parsing
- Interactive drag & drop diagrams with zoom and minimap
- Compatible with Prisma 5, 6 and 7
- Export to Mermaid, PlantUML, DBML
- Auto-layout with dagre

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Diagrams:** ReactFlow
- **Monorepo:** pnpm + Turborepo

## Packages

- [`@prisma-uml/parser`](./packages/prisma-parser/) - Schema parsing and export

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Build

```bash
pnpm build
pnpm start
```

## Author

[Jessy DAVID](https://jessy-david.dev)

## Acknowledgements

- [prisma-generate-uml](https://github.com/AbianS/prisma-generate-uml) - Inspiration for this project
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [ReactFlow](https://reactflow.dev/) - Interactive node-based diagrams
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [dagre](https://github.com/dagrejs/dagre) - Graph layout algorithm
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor

## License

MIT
