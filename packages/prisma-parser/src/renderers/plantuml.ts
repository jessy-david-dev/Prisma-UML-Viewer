import type { PrismaSchema } from '../types';

export function toPlantUML(schema: PrismaSchema): string {
  const lines: string[] = [
    '@startuml',
    '!theme blueprint',
    'skinparam linetype ortho',
    'skinparam class {',
    '    BackgroundColor #1e1e2e',
    '    BorderColor #89b4fa',
    '    ArrowColor #89b4fa',
    '    FontColor #cdd6f4',
    '}',
    '',
  ];

  for (const model of schema.models) {
    const displayName = model.dbName ? `"${model.name}\\n(${model.dbName})"` : `"${model.name}"`;
    lines.push(`entity ${displayName} as ${model.name} {`);

    const pkFields = model.fields.filter((f) => f.isId);
    const fkFields = model.fields.filter(
      (f) => f.relationFromFields?.length && !f.isId && f.kind !== 'object'
    );
    const regularFields = model.fields.filter(
      (f) => !f.isId && f.kind !== 'object' && !f.relationFromFields?.length
    );

    // Primary keys
    for (const field of pkFields) {
      const nullable = field.isRequired ? '' : ' (nullable)';
      lines.push(`  * ${field.name} : ${field.type}${nullable} <<PK>>`);
    }

    if (pkFields.length && (fkFields.length || regularFields.length)) {
      lines.push('  --');
    }

    // Foreign keys
    for (const field of fkFields) {
      const optional = field.isRequired ? '*' : 'o';
      const unique = field.isUnique ? ' <<UK>>' : '';
      lines.push(`  ${optional} ${field.name} : ${field.type}${unique} <<FK>>`);
    }

    if (fkFields.length && regularFields.length) {
      lines.push('  ..');
    }

    // Regular fields
    for (const field of regularFields) {
      const optional = field.isRequired ? '*' : 'o';
      const unique = field.isUnique ? ' <<UK>>' : '';
      const updatedAt = field.isUpdatedAt ? ' <<updatedAt>>' : '';
      lines.push(`  ${optional} ${field.name} : ${field.type}${unique}${updatedAt}`);
    }

    lines.push('}');
    lines.push('');
  }

  for (const enumDef of schema.enums) {
    lines.push(`enum ${enumDef.name} {`);
    for (const value of enumDef.values) {
      const dbName = value.dbName ? ` [${value.dbName}]` : '';
      lines.push(`  ${value.name}${dbName}`);
    }
    lines.push('}');
    lines.push('');
  }

  const processedRelations = new Set<string>();

  for (const model of schema.models) {
    for (const field of model.fields) {
      if (field.kind === 'object' && field.relationFromFields?.length) {
        const target = field.type.replace('[]', '');
        const relationKey = `${model.name}-${target}-${field.relationName || field.name}`;

        if (processedRelations.has(relationKey)) continue;
        processedRelations.add(relationKey);

        const sourceCard = field.isRequired ? '1' : '0..1';
        const targetCard = field.isList ? '*' : '1';

        lines.push(`${model.name} "${sourceCard}" --> "${targetCard}" ${target} : ${field.name}`);
      }
    }
  }

  lines.push('');
  lines.push('@enduml');

  return lines.join('\n');
}
