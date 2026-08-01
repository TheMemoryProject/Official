import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { DecisionStatus } from '@prisma/client';

const createDecisionSchema = z.object({
  title: z.string().min(5),
  decisionSummary: z.string().min(10),
  detailedRationale: z.string().min(15),
  alternativesConsidered: z.string().min(10),
  chosenOption: z.string().min(5),
  tradeoffs: z.string().min(5),
  risks: z.string().min(5),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
  knowledgeEntryId: z.string().uuid().optional(),
  failureRecordId: z.string().uuid().optional(),
  evidenceRecordId: z.string().uuid().optional(),
  standardId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const whereClause: any = { archivedAt: null };
    if (status) whereClause.status = status as DecisionStatus;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { decisionSummary: { contains: query, mode: 'insensitive' } },
        { chosenOption: { contains: query, mode: 'insensitive' } },
        { detailedRationale: { contains: query, mode: 'insensitive' } },
      ];
    }

    const decisions = await prisma.engineeringDecision.findMany({
      where: whereClause,
      include: {
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        owner: { select: { fullName: true, title: true } },
        knowledgeEntry: { select: { title: true } },
        failureRecord: { select: { title: true } },
        standard: { select: { standardNumber: true } },
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ decisions });
  } catch (error) {
    console.error('Error fetching engineering decisions:', error);
    return NextResponse.json({ error: 'Failed to fetch engineering decisions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createDecisionSchema.parse(body);

    const decision = await prisma.engineeringDecision.create({
      data: {
        ...data,
        ownerId: session.id,
        organizationId: session.organizationId,
        status: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'PUBLISHED' : 'DRAFT',
        approvalDate: session.role === 'ADMIN' || session.role === 'VERIFIER' ? new Date() : null,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        actionType: 'DECISION_CREATED',
        targetType: 'DECISION',
        targetId: decision.id,
        summary: `Created Engineering Decision: ${decision.title}`,
      },
    });

    return NextResponse.json({ success: true, decision });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating engineering decision:', error);
    return NextResponse.json({ error: 'Failed to create engineering decision' }, { status: 500 });
  }
}
