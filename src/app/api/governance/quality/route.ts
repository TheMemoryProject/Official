import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateKnowledgeQualityScore } from '@/lib/governance/quality-engine';

export async function GET() {
  try {
    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      take: 20,
      select: {
        id: true,
        title: true,
        problemSummary: true,
        solutionSummary: true,
        technicalExplanation: true,
        verificationStatus: true,
        complianceMappings: { select: { id: true } },
      },
    });

    const evaluated = knowledgeEntries.map((k) => {
      const scores = calculateKnowledgeQualityScore({
        title: k.title,
        problemSummary: k.problemSummary,
        solutionSummary: k.solutionSummary,
        technicalExplanation: k.technicalExplanation,
        verificationStatus: k.verificationStatus,
        hasEvidence: true,
        hasStandards: k.complianceMappings.length > 0,
      });

      return {
        id: k.id,
        title: k.title,
        verificationStatus: k.verificationStatus,
        ...scores,
      };
    });

    const averageQualityScore = Math.round(
      evaluated.reduce((acc, curr) => acc + curr.overallQualityScore, 0) / (evaluated.length || 1)
    );

    return NextResponse.json({ evaluated, averageQualityScore });
  } catch (error) {
    console.error('Error fetching quality scores:', error);
    return NextResponse.json({ error: 'Failed to fetch quality scores' }, { status: 500 });
  }
}
