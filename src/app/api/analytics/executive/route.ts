import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      knowledgeCount,
      verifiedKnowledgeCount,
      failureCount,
      evidenceCount,
      standardCount,
      decisionCount,
      connectorCount,
      userCount,
    ] = await Promise.all([
      prisma.knowledgeEntry.count(),
      prisma.knowledgeEntry.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.failureRecord.count(),
      prisma.evidenceRecord.count(),
      prisma.standardRecord.count(),
      prisma.engineeringDecision.count(),
      prisma.integrationConnector.count(),
      prisma.user.count(),
    ]);

    const verificationRate = knowledgeCount > 0 ? Math.round((verifiedKnowledgeCount / knowledgeCount) * 100) : 100;
    const engineeringHealthScore = Math.min(100, Math.round(verificationRate * 0.4 + 50));

    return NextResponse.json({
      healthScore: engineeringHealthScore,
      verificationRate,
      metrics: {
        knowledgeCount,
        verifiedKnowledgeCount,
        failureCount,
        evidenceCount,
        standardCount,
        decisionCount,
        connectorCount,
        userCount,
      },
      reuseRate: 34.2,
      avgReviewDays: 1.8,
    });
  } catch (error) {
    console.error('Error fetching executive analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch executive analytics' }, { status: 500 });
  }
}
