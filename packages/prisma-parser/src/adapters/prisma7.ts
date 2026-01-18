import type { PrismaAdapter, PrismaSchema } from '../types';
import { Prisma6Adapter } from './prisma6';

export class Prisma7Adapter extends Prisma6Adapter implements PrismaAdapter {
  async parse(schemaContent: string): Promise<PrismaSchema> {
    const baseSchema = await super.parse(schemaContent);

    baseSchema.version = 7;

    this.parsePrisma7Features(baseSchema, schemaContent);

    return baseSchema;
  }

  private parsePrisma7Features(schema: PrismaSchema, schemaContent: string): void {
    for (const model of schema.models) {
      for (const field of model.fields) {
        const fieldLine = this.findFieldLine(schemaContent, model.name, field.name);
        if (fieldLine) {
          const nativeTypeMatch = fieldLine.match(/@db\.(\w+)(?:\(([^)]*)\))?/);
          if (nativeTypeMatch) {
            field.nativeType = nativeTypeMatch[1];
          }
        }
      }
    }
  }

  private findFieldLine(schema: string, modelName: string, fieldName: string): string | null {
    const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([^}]+)\\}`, 's');
    const modelMatch = schema.match(modelRegex);

    if (!modelMatch) return null;

    const lines = modelMatch[1].split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(fieldName)) {
        return line;
      }
    }

    return null;
  }
}
