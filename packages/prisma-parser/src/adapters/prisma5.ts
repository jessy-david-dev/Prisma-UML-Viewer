import type {
  PrismaAdapter,
  PrismaSchema,
  PrismaModel,
  PrismaField,
  PrismaEnum,
  EnumValue,
  Datasource,
  Generator,
  UniqueConstraint,
  Index,
  CompositePrimaryKey,
  DefaultValue,
} from '../types';

export class Prisma5Adapter implements PrismaAdapter {
  async parse(schemaContent: string): Promise<PrismaSchema> {
    const models = this.parseModels(schemaContent);
    const enums = this.parseEnums(schemaContent);
    const datasource = this.parseDatasource(schemaContent);
    const generators = this.parseGenerators(schemaContent);

    return {
      version: 5,
      models,
      enums,
      datasource,
      generators,
    };
  }

  private parseModels(schema: string): PrismaModel[] {
    const models: PrismaModel[] = [];
    const modelRegex = /(?:\/\/\/\s*(.+?)\n)?model\s+(\w+)\s*\{([^}]+)\}/gs;

    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const documentation = match[1]?.trim();
      const name = match[2];
      const body = match[3];

      const model: PrismaModel = {
        name,
        fields: this.parseFields(body),
        uniqueConstraints: this.parseUniqueConstraints(body),
        indexes: this.parseIndexes(body),
        documentation,
      };

      // Parse @@map for dbName
      const mapMatch = body.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        model.dbName = mapMatch[1];
      }

      // Parse @@id for composite primary key
      const idMatch = body.match(/@@id\(\[([^\]]+)\]\)/);
      if (idMatch) {
        model.primaryKey = {
          fields: idMatch[1].split(',').map((f) => f.trim()),
        };
      }

      models.push(model);
    }

    return models;
  }

  private parseFields(body: string): PrismaField[] {
    const fields: PrismaField[] = [];
    const lines = body.split('\n');

    let currentDoc = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Capture documentation
      if (trimmedLine.startsWith('///')) {
        currentDoc = trimmedLine.replace('///', '').trim();
        continue;
      }

      // Skip empty lines and block attributes
      if (!trimmedLine || trimmedLine.startsWith('@@')) {
        currentDoc = '';
        continue;
      }

      // Parse field
      const fieldMatch = trimmedLine.match(/^(\w+)\s+(\w+)(\[\])?\??(.*)$/);
      if (fieldMatch) {
        const [, fieldName, fieldType, isList, attributes] = fieldMatch;

        const field: PrismaField = {
          name: fieldName,
          type: fieldType,
          kind: this.getFieldKind(fieldType, attributes),
          isList: !!isList,
          isRequired: !trimmedLine.includes('?') || trimmedLine.includes('@id'),
          isUnique: attributes.includes('@unique'),
          isId: attributes.includes('@id'),
          isUpdatedAt: attributes.includes('@updatedAt'),
          hasDefaultValue: attributes.includes('@default'),
          documentation: currentDoc || undefined,
        };

        // Parse @default value
        if (field.hasDefaultValue) {
          field.default = this.parseDefaultValue(attributes);
        }

        // Parse @relation
        if (attributes.includes('@relation')) {
          this.parseRelation(field, attributes);
        }

        fields.push(field);
        currentDoc = '';
      }
    }

    return fields;
  }

  private getFieldKind(
    type: string,
    attributes: string
  ): 'scalar' | 'object' | 'enum' | 'unsupported' {
    const scalarTypes = [
      'String',
      'Int',
      'Float',
      'Boolean',
      'DateTime',
      'Json',
      'Bytes',
      'BigInt',
      'Decimal',
    ];

    if (attributes.includes('@relation')) {
      return 'object';
    }

    if (scalarTypes.includes(type)) {
      return 'scalar';
    }

    if (attributes.includes('Unsupported')) {
      return 'unsupported';
    }

    // If it's not a scalar and not a relation, it's likely an enum
    return 'enum';
  }

  private parseDefaultValue(attributes: string): DefaultValue | undefined {
    const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
    if (!defaultMatch) return undefined;

    const value = defaultMatch[1].trim();

    // Function call (e.g., autoincrement(), now(), uuid())
    if (value.includes('(')) {
      const funcMatch = value.match(/(\w+)\(([^)]*)\)/);
      if (funcMatch) {
        return {
          name: funcMatch[1],
          args: funcMatch[2] ? [funcMatch[2]] : [],
        };
      }
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }

    // String
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    return value;
  }

  private parseRelation(field: PrismaField, attributes: string): void {
    // Parse relation name
    const nameMatch = attributes.match(/@relation\("([^"]+)"/);
    if (nameMatch) {
      field.relationName = nameMatch[1];
    }

    // Parse fields
    const fieldsMatch = attributes.match(/fields:\s*\[([^\]]+)\]/);
    if (fieldsMatch) {
      field.relationFromFields = fieldsMatch[1].split(',').map((f) => f.trim());
    }

    // Parse references
    const refsMatch = attributes.match(/references:\s*\[([^\]]+)\]/);
    if (refsMatch) {
      field.relationToFields = refsMatch[1].split(',').map((f) => f.trim());
    }
  }

  private parseUniqueConstraints(body: string): UniqueConstraint[] {
    const constraints: UniqueConstraint[] = [];
    const regex = /@@unique\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/g;

    let match;
    while ((match = regex.exec(body)) !== null) {
      constraints.push({
        fields: match[1].split(',').map((f) => f.trim()),
        name: match[2],
      });
    }

    return constraints;
  }

  private parseIndexes(body: string): Index[] {
    const indexes: Index[] = [];
    const regex = /@@index\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/g;

    let match;
    while ((match = regex.exec(body)) !== null) {
      indexes.push({
        fields: match[1].split(',').map((f) => f.trim()),
        name: match[2],
      });
    }

    return indexes;
  }

  private parseEnums(schema: string): PrismaEnum[] {
    const enums: PrismaEnum[] = [];
    const enumRegex = /(?:\/\/\/\s*(.+?)\n)?enum\s+(\w+)\s*\{([^}]+)\}/gs;

    let match;
    while ((match = enumRegex.exec(schema)) !== null) {
      const documentation = match[1]?.trim();
      const name = match[2];
      const body = match[3];

      const values = this.parseEnumValues(body);

      enums.push({
        name,
        values,
        documentation,
      });
    }

    return enums;
  }

  private parseEnumValues(body: string): EnumValue[] {
    const values: EnumValue[] = [];
    const lines = body.split('\n');

    let currentDoc = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('///')) {
        currentDoc = trimmedLine.replace('///', '').trim();
        continue;
      }

      if (!trimmedLine) {
        currentDoc = '';
        continue;
      }

      const valueMatch = trimmedLine.match(/^(\w+)(?:\s+@map\("([^"]+)"\))?/);
      if (valueMatch) {
        values.push({
          name: valueMatch[1],
          dbName: valueMatch[2],
          documentation: currentDoc || undefined,
        });
        currentDoc = '';
      }
    }

    return values;
  }

  private parseDatasource(schema: string): Datasource {
    const dsMatch = schema.match(/datasource\s+(\w+)\s*\{([^}]+)\}/s);

    if (!dsMatch) {
      return {
        name: 'db',
        provider: 'postgresql',
        url: 'env("DATABASE_URL")',
      };
    }

    const name = dsMatch[1];
    const body = dsMatch[2];

    const providerMatch = body.match(/provider\s*=\s*"([^"]+)"/);
    const urlMatch = body.match(/url\s*=\s*(?:env\("([^"]+)"\)|"([^"]+)")/);
    const directUrlMatch = body.match(/directUrl\s*=\s*(?:env\("([^"]+)"\)|"([^"]+)")/);

    return {
      name,
      provider: providerMatch?.[1] || 'postgresql',
      url: urlMatch?.[1] ? `env("${urlMatch[1]}")` : urlMatch?.[2] || '',
      directUrl: directUrlMatch?.[1] ? `env("${directUrlMatch[1]}")` : directUrlMatch?.[2],
    };
  }

  private parseGenerators(schema: string): Generator[] {
    const generators: Generator[] = [];
    const genRegex = /generator\s+(\w+)\s*\{([^}]+)\}/gs;

    let match;
    while ((match = genRegex.exec(schema)) !== null) {
      const name = match[1];
      const body = match[2];

      const providerMatch = body.match(/provider\s*=\s*"([^"]+)"/);
      const outputMatch = body.match(/output\s*=\s*"([^"]+)"/);
      const previewMatch = body.match(/previewFeatures\s*=\s*\[([^\]]+)\]/);
      const binaryMatch = body.match(/binaryTargets\s*=\s*\[([^\]]+)\]/);

      generators.push({
        name,
        provider: providerMatch?.[1] || 'prisma-client-js',
        output: outputMatch?.[1],
        previewFeatures: previewMatch?.[1]?.split(',').map((f) => f.trim().replace(/"/g, '')),
        binaryTargets: binaryMatch?.[1]?.split(',').map((t) => t.trim().replace(/"/g, '')),
      });
    }

    return generators;
  }
}
