import type { PrismaAdapter, PrismaSchema } from '../types';
import { Prisma5Adapter } from './prisma5';

export class Prisma6Adapter extends Prisma5Adapter implements PrismaAdapter {
  async parse(schemaContent: string): Promise<PrismaSchema> {
    const baseSchema = await super.parse(schemaContent);

    baseSchema.version = 6;

    this.parsePrisma6Features(baseSchema, schemaContent);

    return baseSchema;
  }

  private parsePrisma6Features(schema: PrismaSchema, schemaContent: string): void {
    for (const model of schema.models) {
      for (const field of model.fields) {
        const fieldPattern = new RegExp(`${field.name}\\s+${field.type}[^\\n]*@omit`, 'g');
        if (fieldPattern.test(schemaContent)) {
          field.isOmitted = true;
        }
      }
    }
  }
}
