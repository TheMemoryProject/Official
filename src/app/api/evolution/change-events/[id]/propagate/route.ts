import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { runPropagation, ReconciliationError } from '@/lib/evolution/service';

export const dynamic = 'force-dynamic';

/**
 * Propagates a detected change event through the knowledge dependency graph.
 *
 * Returns the full reconciliation report. Per Rule 1.3 the caller can verify that every
 * candidate was accounted for as either impacted or skipped-with-a-reason; a run that
 * does not reconcile fails loudly rather than silently dropping records.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { report, result } = await runPropagation(prisma, id);

    return NextResponse.json({
      report,
      impacts: result.impacts.map((i) => ({
        knowledgeId: i.knowledgeId,
        criticality: i.criticality,
        depth: i.depth,
        previousStatus: i.previousStatus,
        newStatus: i.newStatus,
        opensTask: i.opensTask,
        reason: i.reason,
        path: i.path,
      })),
    });
  } catch (error) {
    if (error instanceof ReconciliationError) {
      // Fail closed and surface the numbers, so the mismatch is diagnosable.
      return NextResponse.json({ error: error.message, report: error.report }, { status: 500 });
    }
    if (error instanceof Error && /already been propagated/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && /not found/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Propagation error:', error);
    return NextResponse.json({ error: 'Failed to propagate change event' }, { status: 500 });
  }
}
