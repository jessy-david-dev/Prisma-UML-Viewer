# @prisma-uml/parser

Internal package for parsing Prisma schemas.

## Features

- Parse Prisma schemas (v5, v6, v7)
- Auto-detect Prisma version
- Export to Mermaid, PlantUML, DBML

## Usage

```typescript
import { parsePrismaSchema, toMermaid } from '@prisma-uml/parser';

const parsed = await parsePrismaSchema(schemaString);
const mermaid = toMermaid(parsed);
```

## License

MIT
