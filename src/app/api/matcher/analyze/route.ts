import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeProblemSimilarity } from '@/lib/matcher/similarity-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { primaryFunction, failureMode, phenomenon, materialFamily, process, operatingTempMax } = body;

    const candidates = await prisma.knowledgeEntry.findMany({
      where: { verificationStatus: 'VERIFIED', deletedAt: null },
      include: {
        domain: { select: { name: true } },
        industry: { select: { name: true } },
      },
      take: 50,
    });

    const matches = candidates.map((cand) =>
      computeProblemSimilarity(
        {
          title: cand.title,
          primaryFunction: primaryFunction || cand.title,
          failureMode: failureMode || '',
          phenomenon: phenomenon || '',
          materialFamily,
          process,
          operatingTempMax,
        },
        {
          id: cand.id,
          title: cand.title,
          problemSummary: cand.problemSummary,
          solutionSummary: cand.solutionSummary,
          technicalExplanation: cand.technicalExplanation,
          knownConstraints: cand.knownConstraints,
          failureModes: cand.failureModes,
          domainName: cand.domain.name,
          industryName: cand.industry.name,
        }
      )
    );

    matches.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Matcher API error:', error);
    return NextResponse.json({ error: 'Failed to analyze problem matching' }, { status: 500 });
  }
}
