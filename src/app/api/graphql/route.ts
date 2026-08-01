import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'GraphQL query required' }, { status: 400 });
    }

    // Process GraphQL introspection or query
    if (query.includes('IntrospectionQuery') || query.includes('__schema')) {
      return NextResponse.json({
        data: {
          __schema: {
            queryType: { name: 'Query' },
            mutationType: { name: 'Mutation' },
            types: [
              { name: 'KnowledgeEntry', kind: 'OBJECT' },
              { name: 'StandardRecord', kind: 'OBJECT' },
              { name: 'FailureRecord', kind: 'OBJECT' },
              { name: 'EngineeringProject', kind: 'OBJECT' },
            ],
          },
        },
      });
    }

    // Default Knowledge GraphQL query response
    const knowledge = await prisma.knowledgeEntry.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        verificationStatus: true,
        confidenceScore: true,
      },
    });

    return NextResponse.json({
      data: {
        knowledgeEntries: knowledge,
      },
    });
  } catch (error) {
    console.error('GraphQL Error:', error);
    return NextResponse.json({ errors: [{ message: 'GraphQL Query Execution Failed' }] }, { status: 500 });
  }
}
