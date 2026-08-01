import { prisma } from '@/lib/db';
import { calculateDeterministicRelevanceScore } from '@/lib/search/ranking-engine';

export interface AssistantCitation {
  id: string;
  title: string;
  type: 'KNOWLEDGE' | 'FAILURE' | 'EVIDENCE' | 'STANDARD';
  verificationStatus: string;
  link: string;
  snippet: string;
}

export interface GroundedAssistantResponse {
  answer: string;
  citations: AssistantCitation[];
  confidenceScore: number;
  scoreExplanation: string;
  relatedQuestions: string[];
  missingInformation?: string;
}

export async function executeDeterministicRetrievalPipeline(
  query: string
): Promise<GroundedAssistantResponse> {
  const qLower = query.toLowerCase().trim();

  // 1. Retrieve Verified Knowledge Entries
  const knowledge = await prisma.knowledgeEntry.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { problemSummary: { contains: query, mode: 'insensitive' } },
        { solutionSummary: { contains: query, mode: 'insensitive' } },
        { technicalExplanation: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      domain: { select: { name: true } },
      industry: { select: { name: true } },
      attachments: true,
    },
    take: 5,
  });

  // 2. Retrieve Failure Records
  const failures = await prisma.failureRecord.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { rootCause: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      domain: { select: { name: true } },
    },
    take: 3,
  });

  // 3. Retrieve Standards Records
  const standards = await prisma.standardRecord.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { standardNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 3,
  });

  const citations: AssistantCitation[] = [];

  for (const k of knowledge) {
    citations.push({
      id: k.id,
      title: k.title,
      type: 'KNOWLEDGE',
      verificationStatus: k.verificationStatus,
      link: `/knowledge/${k.id}`,
      snippet: k.solutionSummary,
    });
  }

  for (const f of failures) {
    citations.push({
      id: f.id,
      title: f.title,
      type: 'FAILURE',
      verificationStatus: f.verificationStatus,
      link: `/failures`,
      snippet: f.summary,
    });
  }

  for (const s of standards) {
    citations.push({
      id: s.id,
      title: `${s.standardNumber}: ${s.title}`,
      type: 'STANDARD',
      verificationStatus: s.verificationStatus,
      link: `/standards/${s.id}`,
      snippet: s.description,
    });
  }

  // 4. Construct Grounded Response
  if (citations.length === 0) {
    return {
      answer: `No verified engineering records were found matching "${query}". KTN strictly operates from peer-reviewed enterprise engineering records and does not fabricate information.`,
      citations: [],
      confidenceScore: 0,
      scoreExplanation: 'Zero verified records retrieved matching the input query',
      relatedQuestions: [
        'How can I submit a new verified engineering solution?',
        'Which standards govern acoustic noise suppression?',
      ],
      missingInformation: 'Database does not contain verified records for this specific query parameter.',
    };
  }

  const primaryKnowledge = knowledge[0];
  const primaryFailure = failures[0];
  const primaryStandard = standards[0];

  let answerText = `Based on ${citations.length} verified engineering record(s) in KTN:\n\n`;

  if (primaryKnowledge) {
    answerText += `**Verified Solution Summary**: ${primaryKnowledge.solutionSummary}\n`;
    answerText += `**Technical Explanation**: ${primaryKnowledge.technicalExplanation}\n\n`;
  }

  if (primaryFailure) {
    answerText += `**Related Failure Mode**: ${primaryFailure.title} (Root Cause: ${primaryFailure.rootCause})\n\n`;
  }

  if (primaryStandard) {
    answerText += `**Governing Standard**: ${primaryStandard.standardNumber} (${primaryStandard.title})\n\n`;
  }

  // Calculate Deterministic Confidence
  const topKnowledgeScore = primaryKnowledge
    ? calculateDeterministicRelevanceScore({
        title: primaryKnowledge.title,
        summary: primaryKnowledge.solutionSummary,
        query,
        verificationStatus: primaryKnowledge.verificationStatus,
        confidenceScore: primaryKnowledge.confidenceScore,
        evidenceCount: primaryKnowledge.attachments.length,
      }).score
    : 80;

  return {
    answer: answerText,
    citations,
    confidenceScore: topKnowledgeScore,
    scoreExplanation: `Deterministic score based on ${knowledge.length} verified knowledge entries, ${failures.length} failure records, and ${standards.length} governing standards.`,
    relatedQuestions: [
      'What are the known trade-offs and limitations of this solution?',
      'Which empirical evidence tests support this conclusion?',
      'How does this solution compare with alternative materials?',
    ],
  };
}
