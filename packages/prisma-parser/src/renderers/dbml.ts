import type { PrismaSchema, PrismaField } from '../types';

export function toDBML(schema: PrismaSchema): string {
  const lines: string[] = [];

  lines.push('// Generated from Prisma Schema');
  lines.push(`// Prisma Version: ${schema.version}`);
  lines.push('');

  lines.push('Project prisma_schema {');
  lines.push(`  database_type: '${mapProviderToDBType(schema.datasource.provider)}'`);
  lines.push('}');
  lines.push('');

  for (const enumDef of schema.enums) {
    if (enumDef.documentation) {
      lines.push(`// ${enumDef.documentation}`);
    }
    lines.push(`Enum ${enumDef.name} {`);
    for (const value of enumDef.values) {
      const note = value.documentation ? ` [note: '${value.documentation}']` : '';
      lines.push(`  ${value.name}${note}`);
    }
    lines.push('}');
    lines.push('');
  }

  for (const model of schema.models) {
    if (model.documentation) {
      lines.push(`// ${model.documentation}`);
    }

    const tableName = model.dbName || model.name;
    lines.push(`Table ${tableName} {`);

    for (const field of model.fields) {
      // Skip relation fields (object kind)
      if (field.kind === 'object') continue;

      const dbmlField = fieldToDBML(field);
      lines.push(`  ${dbmlField}`);
    }

    // Add indexes
    if (model.indexes.length > 0 || model.uniqueConstraints.length > 0) {
      lines.push('');
      lines.push('  indexes {');

      for (const idx of model.indexes) {
        const idxName = idx.name ? ` [name: '${idx.name}']` : '';
        lines.push(`    (${idx.fields.join(', ')})${idxName}`);
      }

      for (const unique of model.uniqueConstraints) {
        const uniqueName = unique.name ? ` [name: '${unique.name}']` : '';
        lines.push(`    (${unique.fields.join(', ')}) [unique]${uniqueName}`);
      }

      lines.push('  }');
    }

    lines.push('}');
    lines.push('');
  }

  for (const model of schema.models) {
    for (const field of model.fields) {
      if (field.kind === 'object' && field.relationFromFields?.length) {
        const targetModel = field.type.replace('[]', '');
        const sourceFields = field.relationFromFields.join(', ');
        const targetFields = field.relationToFields?.join(', ') || 'id';

        const relationType = field.isList ? '<>' : field.isRequired ? '-' : '-';
        const sourceName = model.dbName || model.name;
        const targetName = schema.models.find((m) => m.name === targetModel)?.dbName || targetModel;

        lines.push(
          `Ref: ${sourceName}.${sourceFields} ${relationType} ${targetName}.${targetFields}`
        );
      }
    }
  }

  return lines.join('\n');
}

function fieldToDBML(field: PrismaField): string {
  const parts: string[] = [];

  parts.push(field.name);

  const dbmlType = mapPrismaTypeToDBML(field.type, field.isList);
  parts.push(dbmlType);

  const settings: string[] = [];

  if (field.isId) {
    settings.push('pk');
  }

  if (field.isUnique && !field.isId) {
    settings.push('unique');
  }

  if (!field.isRequired && !field.isId) {
    settings.push('null');
  } else if (!field.isId) {
    settings.push('not null');
  }

  if (field.hasDefaultValue && field.default !== undefined) {
    const defaultStr = formatDefault(field.default);
    if (defaultStr) {
      settings.push(`default: ${defaultStr}`);
    }
  }

  if (field.isUpdatedAt) {
    settings.push("note: 'Updated automatically'");
  }

  if (field.documentation) {
    settings.push(`note: '${field.documentation}'`);
  }

  if (settings.length > 0) {
    parts.push(`[${settings.join(', ')}]`);
  }

  return parts.join(' ');
}

function mapPrismaTypeToDBML(type: string, isList: boolean): string {
  const mapping: Record<string, string> = {
    String: 'varchar',
    Int: 'integer',
    BigInt: 'bigint',
    Float: 'float',
    Decimal: 'decimal',
    Boolean: 'boolean',
    DateTime: 'timestamp',
    Json: 'json',
    Bytes: 'bytea',
  };

  const mappedType = mapping[type] || type.toLowerCase();
  return isList ? `${mappedType}[]` : mappedType;
}

function mapProviderToDBType(provider: string): string {
  const mapping: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    sqlserver: 'SQL Server',
    mongodb: 'MongoDB',
    cockroachdb: 'CockroachDB',
  };
  return mapping[provider] || provider;
}

function formatDefault(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const func = value as { name: string; args: unknown[] };
    switch (func.name) {
      case 'autoincrement':
        return null; // Handled by pk
      case 'now':
        return '`now()`';
      case 'uuid':
        return '`uuid()`';
      case 'cuid':
        return '`cuid()`';
      default:
        return `\`${func.name}()\``;
    }
  }

  if (typeof value === 'string') {
    return `'${value}'`;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}
