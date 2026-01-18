/**
 * API endpoint to parse Prisma schemas
 * Returns a structured representation of the schema for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePrismaSchema, validatePrismaSchema } from '@prisma-uml/parser';
import { z } from 'zod';

// validate incoming request body
const requestSchema = z.object({
  schema: z.string().min(1, 'Schema is required'),
  version: z.enum(['5', '6', '7']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schema, version } = requestSchema.parse(body);

    // quick validation before parsing
    const validation = validatePrismaSchema(schema);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid schema', errors: validation.errors },
        { status: 422 }
      );
    }

    // parse the schema - version is auto-detected if not specified
    const parsedSchema = await parsePrismaSchema(schema, {
      version: version ? (parseInt(version) as 5 | 6 | 7) : undefined,
    });

    return NextResponse.json({ success: true, data: parsedSchema });
  } catch (error) {
    // handle validation errors from zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    // handle parsing errors
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 422 });
    }

    // something unexpected happened
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
