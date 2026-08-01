import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateDeterministicRelevanceScore, SearchResultItem } from '@/lib/search/ranking-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const domainId = searchParams.get('domainId');
    const industryId = searchParams.get('industryId');

    const results: SearchResultItem[] = [];

    // Query Knowledge Entries
    const knowledgeWhere: any = {};
    if (q) {
      knowledgeWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { problemSummary: { contains: q, mode: 'insensitive' } },
        { solutionSummary: { contains: q, mode: 'insensitive' } },
        { technicalExplanation: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (domainId) knowledgeWhere.domainId = domainId;
    if (industryId) knowledgeWhere.industryId = industryId;

    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      where: knowledgeWhere,
      include: {
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        attachments: true,
      },
      take: 20,
    });

    for (const k of knowledgeEntries) {
      const { score, explanation } = calculateDeterministicRelevanceScore({
        title: k.title,
        summary: k.solutionSummary,
        query: q,
        verificationStatus: k.verificationStatus,
        confidenceScore: k.confidenceScore,
        evidenceCount: k.attachments.length,
      });

      results.push({
        id: k.id,
        title: k.title,
        summary: k.solutionSummary,
        type: 'KNOWLEDGE',
        verificationStatus: k.verificationStatus,
        confidenceScore: k.confidenceScore,
        evidenceCount: k.attachments.length,
        domainName: k.domain.name,
        industryName: k.industry.name,
        relevanceScore: score,
        scoreExplanation: explanation,
        updatedAt: k.updatedAt,
      });
    }

    // Query Failure Records
    const failureWhere: any = {};
    if (q) {
      failureWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { rootCause: { contains: q, mode: 'insensitive' } },
      ];
    }

    const failures = await prisma.failureRecord.findMany({
      where: failureWhere,
      include: {
        domain: { select: { name: true } },
        industry: { select: { name: true } },
      },
      take: 20,
    });

    for (const f of failures) {
      const { score, explanation } = calculateDeterministicRelevanceScore({
        title: f.title,
        summary: f.summary,
        query: q,
        verificationStatus: f.verificationStatus,
        confidenceScore: 90,
        evidenceCount: 1,
      });

      results.push({
        id: f.id,
        title: f.title,
        summary: f.summary,
        type: 'FAILURE',
        verificationStatus: f.verificationStatus,
        confidenceScore: 90,
        evidenceCount: 1,
        domainName: f.domain.name,
        industryName: f.industry.name,
        relevanceScore: score,
        scoreExplanation: explanation,
        updatedAt: f.updatedAt,
      });
    }

    // Sort by deterministic relevance score descending
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ results, totalCount: results.length });
  } catch (error) {
    console.error('Error executing enterprise search:', error);
    return NextResponse.json({ error: 'Failed to execute search query' }, { status: 500 });
  }
}
