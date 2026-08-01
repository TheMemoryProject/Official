import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const decision = await prisma.engineeringDecision.findUnique({
      where: { id },
      include: {
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        owner: { select: { fullName: true, title: true } },
        knowledgeEntry: { select: { id: true, title: true, solutionSummary: true } },
        failureRecord: { select: { id: true, title: true, rootCause: true } },
        evidenceRecord: { select: { id: true, title: true, evidenceStrengthScore: true } },
        standard: { select: { id: true, standardNumber: true, title: true } },
        tasks: {
          include: {
            assignee: { select: { fullName: true } },
            reporter: { select: { fullName: true } },
          },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Engineering decision not found' }, { status: 404 });
    }

    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Error fetching decision detail:', error);
    return NextResponse.json({ error: 'Failed to fetch decision detail' }, { status: 500 });
  }
}
