// Main exports
export { parsePrismaSchema, validatePrismaSchema } from './parser';
export { detectPrismaVersion, getVersionFeatures } from './version-detector';

// Adapters
export { Prisma5Adapter, Prisma6Adapter, Prisma7Adapter } from './adapters';

// Renderers
export { toMermaid } from './renderers/mermaid';
export { toPlantUML } from './renderers/plantuml';
export { toDBML } from './renderers/dbml';

// Types
export type {
  PrismaSchema,
  PrismaModel,
  PrismaField,
  PrismaEnum,
  EnumValue,
  Datasource,
  Generator,
  PrismaVersion,
  ParserOptions,
  PrismaAdapter,
  DefaultValue,
  CompositePrimaryKey,
  UniqueConstraint,
  Index,
} from './types';
