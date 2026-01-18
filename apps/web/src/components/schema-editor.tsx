'use client';

// Monaco-based editor for Prisma schemas
// Uses debouncing to avoid hammering the API on every keystroke

import { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useDebouncedCallback } from 'use-debounce';
import type { PrismaSchema } from '@prisma-uml/parser';

interface SchemaEditorProps {
  initialValue?: string;
  onSchemaChange: (schema: PrismaSchema, raw: string) => void;
  onError: (error: string | null) => void;
}

// sample schema to show when the page loads
// includes common patterns: relations, enums, optional fields
const DEFAULT_SCHEMA = `// Paste your Prisma schema here

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  avatar String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String
  content   String?
  published Boolean    @default(false)
  author    User       @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]
  comments  Comment[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  createdAt DateTime @default(now())
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

enum Role {
  ADMIN
  USER
  GUEST
}
`;

export function SchemaEditor({
  initialValue = DEFAULT_SCHEMA,
  onSchemaChange,
  onError,
}: SchemaEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<unknown>(null);

  // sends the schema to our API endpoint for parsing
  async function parseSchema(schema: string) {
    setIsLoading(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        // try to extract a meaningful error message
        const msg = result.errors
          ? result.errors.map((e: { message?: string }) => e.message ?? String(e)).join(', ')
          : (result.message ?? 'Parsing error');
        onError(msg);
        return;
      }

      onError(null);
      onSchemaChange(result.data, schema);
    } catch (err) {
      // network error or something unexpected
      onError('Server connection error');
    } finally {
      setIsLoading(false);
    }
  }

  // 500ms debounce seems like a good tradeoff between responsiveness and API load
  const debouncedParse = useDebouncedCallback(parseSchema, 500);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue === undefined) return;
      setValue(newValue);
      debouncedParse(newValue);
    },
    [debouncedParse]
  );

  // parse the initial schema when editor mounts
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    parseSchema(initialValue);
  };

  return (
    <div className="h-full relative">
      {isLoading && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="prisma"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
