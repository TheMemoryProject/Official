import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createKnowledgeSchema = z.object({
  title: z.string().min(5),
  problemSummary: z.string().min(10),
  detailedProblem: z.string().min(10),
  solutionSummary: z.string().min(10),
  technicalExplanation: z.string().min(20),
  knownConstraints: z.string().optional(),
  failureModes: z.string().optional(),
  lessonsLearned: z.string().optional(),
  benefits: z.string().optional(),
  tradeoffs: z.string().optional(),
  implementationSteps: z.string().optional(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const whereClause: any = { deletedAt: null };
    if (status) whereClause.verificationStatus = status;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { problemSummary: { contains: query, mode: 'insensitive' } },
        { solutionSummary: { contains: query, mode: 'insensitive' } },
        { technicalExplanation: { contains: query, mode: 'insensitive' } },
      ];
    }

    const entries = await prisma.knowledgeEntry.findMany({
      where: whereClause,
      include: {
        creator: { select: { fullName: true, title: true } },
        reviewer: { select: { fullName: true } },
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        attachments: true,
        comments: { include: { parentComment: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createKnowledgeSchema.parse(body);

    const entry = await prisma.knowledgeEntry.create({
      data: {
        ...data,
        creatorId: session.id,
        organizationId: session.organizationId,
        verificationStatus: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'VERIFIED' : 'SUBMITTED',
      },
    });

    // Create initial version
    await prisma.knowledgeVersion.create({
      data: {
        knowledgeEntryId: entry.id,
        version: 1,
        title: entry.title,
        problemSummary: entry.problemSummary,
        solutionSummary: entry.solutionSummary,
        technicalExplanation: entry.technicalExplanation,
        editorId: session.id,
        changeSummary: 'Initial Knowledge Entry Creation',
        snapshotJson: JSON.stringify(entry),
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json({ error: 'Failed to create knowledge entry' }, { status: 500 });
  }
}
