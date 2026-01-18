// Export endpoint - converts Prisma schema to various diagram formats

import { NextRequest, NextResponse } from 'next/server';
import { parsePrismaSchema, toMermaid, toPlantUML, toDBML } from '@prisma-uml/parser';
import { z } from 'zod';

const requestSchema = z.object({
  schema: z.string().min(1, 'Schema is required'),
  format: z.enum(['mermaid', 'plantuml', 'dbml']),
});

// map format names to renderer functions
const renderers = {
  mermaid: toMermaid,
  plantuml: toPlantUML,
  dbml: toDBML,
} as const;

type ExportFormat = keyof typeof renderers;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schema, format } = requestSchema.parse(body);

    // first parse the schema, then render to requested format
    const parsed = await parsePrismaSchema(schema);
    const render = renderers[format as ExportFormat];
    const output = render(parsed);

    return NextResponse.json({ success: true, output, format });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
