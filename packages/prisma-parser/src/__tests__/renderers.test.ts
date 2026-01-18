import { describe, it, expect } from 'vitest';
import { parsePrismaSchema, toMermaid, toPlantUML, toDBML } from '../index';

const testSchema = `
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  enum Role {
    ADMIN
    USER
  }

  model User {
    id        Int      @id @default(autoincrement())
    email     String   @unique
    name      String?
    role      Role     @default(USER)
    posts     Post[]
    createdAt DateTime @default(now())
  }

  model Post {
    id        Int      @id @default(autoincrement())
    title     String
    content   String?
    published Boolean  @default(false)
    author    User     @relation(fields: [authorId], references: [id])
    authorId  Int
  }
`;

describe('Renderers', () => {
  describe('Mermaid Renderer', () => {
    it('should generate valid Mermaid ER diagram', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const mermaid = toMermaid(schema);

      expect(mermaid).toContain('erDiagram');
      expect(mermaid).toContain('User {');
      expect(mermaid).toContain('Post {');
      expect(mermaid).toContain('int id "PK"');
      expect(mermaid).toContain('string email "UK"');
    });

    it('should include relations', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const mermaid = toMermaid(schema);

      expect(mermaid).toMatch(/User.*Post/);
    });
  });

  describe('PlantUML Renderer', () => {
    it('should generate valid PlantUML diagram', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const plantuml = toPlantUML(schema);

      expect(plantuml).toContain('@startuml');
      expect(plantuml).toContain('@enduml');
      expect(plantuml).toContain('entity');
      expect(plantuml).toContain('User');
      expect(plantuml).toContain('Post');
    });

    it('should include enums', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const plantuml = toPlantUML(schema);

      expect(plantuml).toContain('enum Role');
      expect(plantuml).toContain('ADMIN');
      expect(plantuml).toContain('USER');
    });
  });

  describe('DBML Renderer', () => {
    it('should generate valid DBML', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const dbml = toDBML(schema);

      expect(dbml).toContain('Project prisma_schema');
      expect(dbml).toContain('Table User');
      expect(dbml).toContain('Table Post');
      expect(dbml).toContain('Ref:');
    });

    it('should include field constraints', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const dbml = toDBML(schema);

      expect(dbml).toContain('pk');
      expect(dbml).toContain('unique');
    });

    it('should include enums', async () => {
      const schema = await parsePrismaSchema(testSchema);
      const dbml = toDBML(schema);

      expect(dbml).toContain('Enum Role');
    });
  });
});
