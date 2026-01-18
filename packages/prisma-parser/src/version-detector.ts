import type { PrismaVersion } from './types';

export function detectPrismaVersion(schema: string): PrismaVersion {
  if (
    schema.includes('typedSql') ||
    schema.includes('@prisma/client/sql') ||
    /generator\s+\w+\s*\{[^}]*provider\s*=\s*"prisma-client"/s.test(schema)
  ) {
    return 7;
  }

  if (
    schema.includes('@omit') ||
    schema.includes('strictUndefinedChecks') ||
    schema.includes('prismaSchemaFolder') ||
    schema.includes('omitApi')
  ) {
    return 6;
  }

  return 5;
}

export function getVersionFeatures(version: PrismaVersion): string[] {
  const features: Record<PrismaVersion, string[]> = {
    5: ['relations', 'enums', 'compositeTypes', 'views'],
    6: ['relations', 'enums', 'compositeTypes', 'views', 'omit', 'strictUndefinedChecks'],
    7: [
      'relations',
      'enums',
      'compositeTypes',
      'views',
      'omit',
      'strictUndefinedChecks',
      'typedSql',
    ],
  };

  return features[version];
}
