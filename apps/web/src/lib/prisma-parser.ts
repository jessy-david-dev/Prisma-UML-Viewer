import {
  parsePrismaSchema as parse,
  validatePrismaSchema,
  detectPrismaVersion,
  type PrismaSchema,
  type ParserOptions,
} from '@prisma-uml/parser';

export async function parsePrismaSchema(
  schemaContent: string,
  options?: ParserOptions
): Promise<PrismaSchema> {
  return parse(schemaContent, options);
}

export { validatePrismaSchema, detectPrismaVersion };
export type { PrismaSchema };
