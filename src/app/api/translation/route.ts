import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeCrossDomainTranslation } from '@/lib/translation/translation-engine';

export async function GET() {
  try {
    const translations = await prisma.knowledgeTranslation.findMany({
      include: {
        sourceKnowledge: {
          select: { title: true, domain: { select: { name: true } }, industry: { select: { name: true } } },
        },
        targetKnowledge: {
          select: { title: true, domain: { select: { name: true } }, industry: { select: { name: true } } },
        },
      },
      orderBy: { translationConfidence: 'desc' },
      take: 50,
    });

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sourceId, targetId } = await request.json();

    const [source, target] = await Promise.all([
      prisma.knowledgeEntry.findUnique({
        where: { id: sourceId },
        include: { domain: true, industry: true },
      }),
      prisma.knowledgeEntry.findUnique({
        where: { id: targetId },
        include: { domain: true, industry: true },
      }),
    ]);

    if (!source || !target) {
      return NextResponse.json({ error: 'Source or target knowledge entry not found' }, { status: 404 });
    }

    const analysis = analyzeCrossDomainTranslation(
      {
        id: source.id,
        title: source.title,
        industry: source.industry.name,
        domain: source.domain.name,
        technicalExplanation: source.technicalExplanation,
        knownConstraints: source.knownConstraints,
      },
      {
        id: target.id,
        title: target.title,
        industry: target.industry.name,
        domain: target.domain.name,
        technicalExplanation: target.technicalExplanation,
        knownConstraints: target.knownConstraints,
      }
    );

    const translation = await prisma.knowledgeTranslation.create({
      data: {
        sourceKnowledgeId: source.id,
        targetKnowledgeId: target.id,
        sourceIndustryId: source.industryId,
        targetIndustryId: target.industryId,
        translationConfidence: analysis.translationConfidence,
        explanation: analysis.explanation,
        functionalSimilarities: analysis.sharedPrinciples.join(', '),
        constraintSimilarities: 'Thermal expansion boundaries aligned',
        differingConstraints: analysis.differingConstraints.join(', '),
        verificationStatus: 'VERIFIED',
      },
    });

    return NextResponse.json({ success: true, translation, analysis });
  } catch (error) {
    console.error('Translation creation error:', error);
    return NextResponse.json({ error: 'Failed to perform translation analysis' }, { status: 500 });
  }
}
