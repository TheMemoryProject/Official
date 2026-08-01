import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateStandardChangeImpact } from '@/lib/standards/impact-engine';

export async function POST(request: Request) {
  try {
    const { standardId, newRevision } = await request.json();

    const standard = await prisma.standardRecord.findUnique({
      where: { id: standardId },
      include: {
        complianceMappings: {
          include: {
            knowledgeEntry: { select: { id: true, title: true } },
            failureRecord: { select: { id: true, title: true } },
            evidenceRecord: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!standard) {
      return NextResponse.json({ error: 'Standard record not found' }, { status: 404 });
    }

    const impact = calculateStandardChangeImpact(
      {
        id: standard.id,
        standardNumber: standard.standardNumber,
        revision: standard.revision,
      },
      newRevision || 'Next Revision',
      standard.complianceMappings
    );

    // Save impact report
    const report = await prisma.standardImpactReport.create({
      data: {
        standardId: standard.id,
        oldRevision: standard.revision,
        newRevision: newRevision || 'Next Revision',
        affectedKnowledge: impact.affectedKnowledgeCount,
        affectedFailures: impact.affectedFailuresCount,
        affectedEvidence: impact.affectedEvidenceCount,
        impactSummary: impact.impactSummary,
        actionItemsJson: JSON.stringify(impact.actionItems),
        requiresHumanReview: true,
        status: 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({ success: true, impact, report });
  } catch (error) {
    console.error('Change Impact Analysis API error:', error);
    return NextResponse.json({ error: 'Failed to analyze change impact' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reports = await prisma.standardImpactReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Impact reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch impact reports' }, { status: 500 });
  }
}
