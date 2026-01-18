import type { PrismaSchema, PrismaField } from '../types';

export function toMermaid(schema: PrismaSchema): string {
  const lines: string[] = ['erDiagram'];

  for (const model of schema.models) {
    lines.push(`    ${model.name} {`);

    for (const field of model.fields) {
      if (field.kind === 'scalar' || field.kind === 'enum') {
        const type = mapPrismaTypeToMermaid(field.type);
        const constraints: string[] = [];

        if (field.isId) constraints.push('PK');
        if (field.isUnique) constraints.push('UK');
        if (field.relationFromFields?.length) constraints.push('FK');

        const constraintStr = constraints.length ? ` "${constraints.join(', ')}"` : '';
        lines.push(`        ${type} ${field.name}${constraintStr}`);
      }
    }

    lines.push('    }');
  }

  lines.push('');

  for (const enumDef of schema.enums) {
    lines.push(`    ${enumDef.name} {`);
    for (const value of enumDef.values) {
      lines.push(`        string ${value.name}`);
    }
    lines.push('    }');
  }

  lines.push('');

  const processedRelations = new Set<string>();

  for (const model of schema.models) {
    for (const field of model.fields) {
      if (field.kind === 'object') {
        const targetModel = field.type.replace('[]', '');
        const relationKey = [model.name, targetModel].sort().join('-');

        if (processedRelations.has(relationKey)) continue;
        processedRelations.add(relationKey);

        const cardinality = getCardinality(field, schema, model.name, targetModel);
        const relationLabel = field.relationName || field.name;

        lines.push(`    ${model.name} ${cardinality} ${targetModel} : "${relationLabel}"`);
      }
    }
  }

  return lines.join('\n');
}

function getCardinality(
  field: PrismaField,
  schema: PrismaSchema,
  sourceModel: string,
  targetModel: string
): string {
  const target = schema.models.find((m) => m.name === targetModel);
  const inverseField = target?.fields.find(
    (f) => f.kind === 'object' && f.type.replace('[]', '') === sourceModel
  );

  const sourceIsList = field.isList;
  const targetIsList = inverseField?.isList ?? false;

  // One-to-Many
  if (!sourceIsList && targetIsList) {
    return '||--o{';
  }

  // Many-to-One
  if (sourceIsList && !targetIsList) {
    return '}o--||';
  }

  // Many-to-Many
  if (sourceIsList && targetIsList) {
    return '}o--o{';
  }

  // One-to-One
  return '||--||';
}

function mapPrismaTypeToMermaid(type: string): string {
  const mapping: Record<string, string> = {
    String: 'string',
    Int: 'int',
    BigInt: 'bigint',
    Float: 'float',
    Decimal: 'decimal',
    Boolean: 'boolean',
    DateTime: 'datetime',
    Json: 'json',
    Bytes: 'bytes',
  };
  return mapping[type] || type.toLowerCase();
}
