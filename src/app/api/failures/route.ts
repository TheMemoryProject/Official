import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createFailureSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  description: z.string().min(10),
  category: z.string(),
  failureType: z.string(),
  subsystem: z.string(),
  component: z.string(),
  phenomenon: z.string(),
  rootCause: z.string(),
  immediateCause: z.string(),
  severity: z.number().min(1).max(10),
  occurrence: z.number().min(1).max(10),
  detectability: z.number().min(1).max(10),
  correctiveActions: z.string(),
  preventiveActions: z.string(),
  lessonsLearned: z.string(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
  fiveWhysJson: z.string().optional(),
  fishboneJson: z.string().optional(),
});

export async function GET() {
  try {
    const failures = await prisma.failureRecord.findMany({
      where: { deletedAt: null },
      include: {
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        contributor: { select: { fullName: true } },
        verifier: { select: { fullName: true } },
      },
      orderBy: { rpn: 'desc' },
      take: 50,
    });

    return NextResponse.json({ failures });
  } catch (error) {
    console.error('Error fetching failure records:', error);
    return NextResponse.json({ error: 'Failed to fetch failure records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createFailureSchema.parse(body);

    const rpn = data.severity * data.occurrence * data.detectability;

    const failure = await prisma.failureRecord.create({
      data: {
        ...data,
        rpn,
        contributorId: session.id,
        organizationId: session.organizationId,
        verificationStatus: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'VERIFIED' : 'SUBMITTED',
      },
    });

    return NextResponse.json({ success: true, failure });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating failure record:', error);
    return NextResponse.json({ error: 'Failed to create failure record' }, { status: 500 });
  }
}
