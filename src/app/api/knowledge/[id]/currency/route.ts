import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { upsertCurrency } from '@/lib/evolution/service';

export const dynamic = 'force-dynamic';

/**
 * Currency of a knowledge object: how far it can still be relied upon today, with the
 * full derivation and the history of every status change that produced it.
 *
 * `breakdown` is sufficient to re-derive the score. If a user cannot see why the number
 * is what it is, this endpoint is not doing its job.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const knowledge = await prisma.knowledgeEntry.findUnique({
      where: { id },
      select: { id: true, title: true, verifiedAt: true, confidenceScore: true },
    });
    if (!knowledge) return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });

    // Recompute on read so the displayed score reflects decay to this moment rather
    // than to whenever it was last written.
    const currency = await upsertCurrency(prisma, id);

    const [openTasks, history, dependencies] = await Promise.all([
      prisma.revalidationTask.findMany({
        where: { knowledgeId: id, status: { in: ['OPEN', 'ASSIGNED', 'IN_REVIEW'] } },
        include: {
          changeEvent: { select: { type: true, subjectIdentifier: true, summary: true } },
        },
        orderBy: { openedAt: 'asc' },
      }),
      prisma.knowledgeStatusHistory.findMany({
        where: { knowledgeId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.knowledgeDependency.findMany({
        where: { knowledgeId: id },
        orderBy: { criticality: 'asc' },
      }),
    ]);

    return NextResponse.json({
      knowledge,
      currency: {
        status: currency.status,
        currencyScore: currency.currencyScore,
        grade: currency.grade,
        decayComponent: currency.decayComponent,
        impactComponent: currency.impactComponent,
        ageDays: currency.ageDays,
        openTaskCount: currency.openTaskCount,
        blockingTaskCount: currency.blockingTaskCount,
        engineVersion: currency.engineVersion,
      },
      // The complete derivation of the number above.
      breakdown: currency.breakdown,
      decay: currency.decay,
      openTasks,
      dependencies,
      history,
    });
  } catch (error) {
    console.error('Knowledge currency error:', error);
    return NextResponse.json({ error: 'Failed to compute knowledge currency' }, { status: 500 });
  }
}
