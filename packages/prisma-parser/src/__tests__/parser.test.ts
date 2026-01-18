import { describe, it, expect } from 'vitest';
import { parsePrismaSchema, detectPrismaVersion, validatePrismaSchema } from '../index';

describe('Prisma Schema Parser', () => {
  it('should parse a basic Prisma 5 schema', async () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      generator client {
        provider = "prisma-client-js"
      }

      model User {
        id    Int     @id @default(autoincrement())
        email String  @unique
        name  String?
      }
    `;

    const result = await parsePrismaSchema(schema);

    expect(result.version).toBe(5);
    expect(result.models).toHaveLength(1);
    expect(result.models[0].name).toBe('User');
    expect(result.models[0].fields).toHaveLength(3);
  });

  it('should detect Prisma 6 features', () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model User {
        id       Int    @id
        password String @omit
      }
    `;

    expect(detectPrismaVersion(schema)).toBe(6);
  });

  it('should detect Prisma 7 features', () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      generator client {
        provider = "prisma-client"
      }

      model User {
        id Int @id
      }
    `;

    expect(detectPrismaVersion(schema)).toBe(7);
  });

  it('should handle relations correctly', async () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model User {
        id    Int    @id
        posts Post[]
      }

      model Post {
        id       Int  @id
        author   User @relation(fields: [authorId], references: [id])
        authorId Int
      }
    `;

    const result = await parsePrismaSchema(schema);

    const userModel = result.models.find((m) => m.name === 'User');
    const postModel = result.models.find((m) => m.name === 'Post');

    expect(userModel?.fields.find((f) => f.name === 'posts')?.kind).toBe('object');
    expect(postModel?.fields.find((f) => f.name === 'author')?.relationFromFields).toEqual([
      'authorId',
    ]);
  });

  it('should parse enums correctly', async () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      enum Role {
        ADMIN
        USER
        GUEST
      }

      model User {
        id   Int  @id
        role Role @default(USER)
      }
    `;

    const result = await parsePrismaSchema(schema);

    expect(result.enums).toHaveLength(1);
    expect(result.enums[0].name).toBe('Role');
    expect(result.enums[0].values).toHaveLength(3);
    expect(result.enums[0].values.map((v) => v.name)).toEqual(['ADMIN', 'USER', 'GUEST']);
  });

  it('should validate schema correctly', () => {
    const validSchema = `
      datasource db {
        provider = "postgresql"
        url = env("DATABASE_URL")
      }

      model User {
        id Int @id
      }
    `;

    const invalidSchema = `
      model User {
        id Int @id
    `;

    expect(validatePrismaSchema(validSchema).valid).toBe(true);
    expect(validatePrismaSchema(invalidSchema).valid).toBe(false);
  });

  it('should parse composite primary keys', async () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model PostTag {
        postId Int
        tagId  Int
        
        @@id([postId, tagId])
      }
    `;

    const result = await parsePrismaSchema(schema);
    const model = result.models[0];

    expect(model.primaryKey).toBeDefined();
    expect(model.primaryKey?.fields).toEqual(['postId', 'tagId']);
  });

  it('should parse indexes and unique constraints', async () => {
    const schema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model User {
        id        Int      @id
        email     String
        firstName String
        lastName  String
        
        @@unique([email])
        @@index([firstName, lastName])
      }
    `;

    const result = await parsePrismaSchema(schema);
    const model = result.models[0];

    expect(model.uniqueConstraints).toHaveLength(1);
    expect(model.uniqueConstraints[0].fields).toEqual(['email']);
    expect(model.indexes).toHaveLength(1);
    expect(model.indexes[0].fields).toEqual(['firstName', 'lastName']);
  });
});
