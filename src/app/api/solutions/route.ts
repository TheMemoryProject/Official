import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

const createSolutionSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  solutionDetails: z.string().min(20, 'Solution details must be detailed'),
  knownLimitations: z.string().optional(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as VerificationStatus | null;
    const query = searchParams.get('q');

    const whereClause: any = {
      deletedAt: null,
    };

    if (status) {
      whereClause.verificationStatus = status;
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { solutionDetails: { contains: query, mode: 'insensitive' } },
      ];
    }

    const solutions = await prisma.verifiedSolution.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, fullName: true, title: true, avatarUrl: true },
        },
        verifier: {
          select: { id: true, fullName: true },
        },
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        problem: { select: { id: true, title: true, severity: true } },
        evidences: true,
        failures: true,
        references: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ solutions });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json({ error: 'Failed to fetch solutions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createSolutionSchema.parse(body);

    const solution = await prisma.verifiedSolution.create({
      data: {
        problemId: data.problemId,
        title: data.title,
        summary: data.summary,
        solutionDetails: data.solutionDetails,
        knownLimitations: data.knownLimitations,
        domainId: data.domainId,
        industryId: data.industryId,
        creatorId: session.id,
        organizationId: session.organizationId,
        verificationStatus: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'VERIFIED' : 'UNVERIFIED',
      },
    });

    return NextResponse.json({ success: true, solution });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating solution:', error);
    return NextResponse.json({ error: 'Failed to create solution' }, { status: 500 });
  }
}
