export type PrismaVersion = 5 | 6 | 7;

export type ScalarDefaultValue = string | number | boolean;

export interface FunctionDefaultValue {
  name: string;
  args: unknown[];
}

export type DefaultValue = ScalarDefaultValue | FunctionDefaultValue;

export interface PrismaField {
  name: string;
  type: string;
  kind: 'scalar' | 'object' | 'enum' | 'unsupported';
  isList: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isId: boolean;
  isUpdatedAt: boolean;
  hasDefaultValue: boolean;
  default?: DefaultValue;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  documentation?: string;
  isOmitted?: boolean;
  nativeType?: string;
}

export interface CompositePrimaryKey {
  name?: string;
  fields: string[];
}

export interface UniqueConstraint {
  name?: string;
  fields: string[];
}

export interface Index {
  name?: string;
  fields: string[];
  type?: 'btree' | 'hash' | 'gist' | 'gin' | 'spgist' | 'brin';
}

export interface PrismaModel {
  name: string;
  dbName?: string;
  fields: PrismaField[];
  primaryKey?: CompositePrimaryKey;
  uniqueConstraints: UniqueConstraint[];
  indexes: Index[];
  documentation?: string;
}

export interface EnumValue {
  name: string;
  dbName?: string;
  documentation?: string;
}

export interface PrismaEnum {
  name: string;
  values: EnumValue[];
  documentation?: string;
}

export interface Datasource {
  name: string;
  provider: string;
  url: string;
  directUrl?: string;
  shadowDatabaseUrl?: string;
}

export interface Generator {
  name: string;
  provider: string;
  output?: string;
  previewFeatures?: string[];
  binaryTargets?: string[];
}

export interface PrismaSchema {
  version: PrismaVersion;
  models: PrismaModel[];
  enums: PrismaEnum[];
  datasource: Datasource;
  generators: Generator[];
}

export interface ParserOptions {
  version?: PrismaVersion;
  strict?: boolean;
}

export interface PrismaAdapter {
  parse(schemaContent: string): Promise<PrismaSchema>;
}
