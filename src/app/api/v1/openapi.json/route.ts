import { NextResponse } from 'next/server';
import { generateOpenApiSpec } from '@/lib/developer/openapi-spec';

export async function GET() {
  const spec = generateOpenApiSpec();
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
