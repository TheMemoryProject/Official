import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluateComplianceReadiness } from '@/lib/standards/compliance-engine';

export async function GET() {
  try {
    const mappings = await prisma.complianceMapping.findMany({
      include: {
        knowledgeEntry: { select: { title: true } },
        standard: { select: { standardNumber: true, officialPublisher: true } },
        hierarchyNode: { select: { identifier: true, title: true } },
        reviewer: { select: { fullName: true } },
        evidenceRecord: { select: { title: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const matrixItems = mappings.map((m) => ({
      id: m.id,
      knowledgeTitle: m.knowledgeEntry?.title || 'System Requirement Mapping',
      standardNumber: m.standard.standardNumber,
      clauseIdentifier: m.hierarchyNode?.identifier || 'General Scope',
      complianceStatus: m.complianceStatus,
      verificationStatus: m.verificationStatus,
      reviewerName: m.reviewer?.fullName || 'Certified Compliance Verifier',
      hasEvidence: !!m.evidenceRecordId,
      openIssues: m.openIssues,
    }));

    const readiness = evaluateComplianceReadiness(matrixItems);

    return NextResponse.json({
      matrix: mappings,
      readiness,
    });
  } catch (error) {
    console.error('Compliance Matrix API error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance matrix' }, { status: 500 });
  }
}
