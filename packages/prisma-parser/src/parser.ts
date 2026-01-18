/**
 * Main parser module
 * Detects Prisma version and delegates to the appropriate adapter
 */

import type { PrismaSchema, ParserOptions, PrismaVersion } from './types';
import { detectPrismaVersion } from './version-detector';
import { Prisma5Adapter, Prisma6Adapter, Prisma7Adapter } from './adapters';

// each Prisma version has slightly different features
const adapters = {
  5: Prisma5Adapter,
  6: Prisma6Adapter,
  7: Prisma7Adapter,
} as const;

/**
 * Parse a Prisma schema string into a structured format
 */
export async function parsePrismaSchema(
  schemaContent: string,
  options?: ParserOptions
): Promise<PrismaSchema> {
  // auto-detect version if not specified
  const version: PrismaVersion = options?.version ?? detectPrismaVersion(schemaContent);

  const AdapterClass = adapters[version];
  const adapter = new AdapterClass();

  return adapter.parse(schemaContent);
}

/**
 * Basic validation - checks for common issues before parsing
 */
export function validatePrismaSchema(schemaContent: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // must have a datasource
  if (!schemaContent.includes('datasource')) {
    errors.push('Missing datasource block');
  }

  // should have at least one model
  if (!schemaContent.includes('model ')) {
    errors.push('No models found in schema');
  }

  // check for balanced braces (common mistake)
  const openBraces = (schemaContent.match(/{/g) || []).length;
  const closeBraces = (schemaContent.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces in schema');
  }

  return { valid: errors.length === 0, errors };
}
