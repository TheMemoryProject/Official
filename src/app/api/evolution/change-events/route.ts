import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changeEventSchema = z.object({
  type: z.enum([
    'STANDARD_REVISED',
    'STANDARD_WITHDRAWN',
    'MATERIAL_SPEC_CHANGED',
    'PROCESS_CHANGED',
    'SUPPLIER_CHANGED',
    'EVIDENCE_SUPERSEDED',
    'EVIDENCE_RETRACTED',
    'FIELD_FAILURE_REPORTED',
    'REGULATION_PUBLISHED',
    'KNOWLEDGE_SUPERSEDED',
    'EXPERT_DEPARTED',
  ]),
  dependencyKind: z.enum([
    'STANDARD',
    'MATERIAL',
    'PROCESS',
    'SUPPLIER',
    'EVIDENCE',
    'KNOWLEDGE',
    'ENVIRONMENT',
    'REGULATION',
    'EXPERT',
  ]),
  subjectIdentifier: z.string().min(1, 'A subject identifier is required'),
  fromRevision: z.string().nullish(),
  toRevision: z.string().nullish(),
  summary: z.string().min(10, 'A change event requires a summary of at least 10 characters'),
  sourceUrl: z.string().url().nullish(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const events = await prisma.changeEvent.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        detectedBy: { select: { fullName: true } },
        _count: { select: { impacts: true, tasks: true } },
      },
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Change event list error:', error);
    return NextResponse.json({ error: 'Failed to list change events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = changeEventSchema.parse(await request.json());

    const event = await prisma.changeEvent.create({
      data: {
        type: data.type as never,
        dependencyKind: data.dependencyKind as never,
        subjectIdentifier: data.subjectIdentifier,
        fromRevision: data.fromRevision ?? null,
        toRevision: data.toRevision ?? null,
        summary: data.summary,
        sourceUrl: data.sourceUrl ?? null,
        detectedById: session.id,
        status: 'DETECTED',
      },
    });

    // Recording is deliberately separate from propagating. A detected change is a fact;
    // acting on it is a decision, and the two are audited independently.
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Change event create error:', error);
    return NextResponse.json({ error: 'Failed to record change event' }, { status: 500 });
  }
}
