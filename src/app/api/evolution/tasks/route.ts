import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** The revalidation queue: knowledge the system believes may no longer hold. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'OPEN';
    const assigneeId = searchParams.get('assigneeId');

    const tasks = await prisma.revalidationTask.findMany({
      where: {
        ...(status === 'ALL' ? {} : { status: status as never }),
        ...(assigneeId ? { assigneeId } : {}),
      },
      include: {
        knowledge: {
          select: { id: true, title: true, verificationStatus: true, verifiedAt: true },
        },
        changeEvent: {
          select: {
            id: true,
            type: true,
            subjectIdentifier: true,
            fromRevision: true,
            toRevision: true,
            summary: true,
          },
        },
        assignee: { select: { id: true, fullName: true } },
      },
      // Blocking work first, then oldest — the queue orders by risk, not by recency.
      orderBy: [{ criticality: 'asc' }, { openedAt: 'asc' }],
      take: 200,
    });

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Revalidation queue error:', error);
    return NextResponse.json({ error: 'Failed to load revalidation queue' }, { status: 500 });
  }
}
