export interface SearchResultItem {
  id: string;
  title: string;
  summary: string;
  type: 'KNOWLEDGE' | 'FAILURE' | 'EVIDENCE' | 'STANDARD' | 'DECISION';
  verificationStatus: string;
  confidenceScore: number;
  evidenceCount: number;
  domainName: string;
  industryName: string;
  scoreExplanation: string;
  relevanceScore: number;
  updatedAt: Date;
}

export function calculateDeterministicRelevanceScore(item: {
  title: string;
  summary: string;
  query: string;
  verificationStatus: string;
  confidenceScore: number;
  evidenceCount: number;
}): { score: number; explanation: string } {
  let score = 0;
  const matchDetails: string[] = [];

  const lowerQuery = item.query.toLowerCase().trim();
  const lowerTitle = item.title.toLowerCase();
  const lowerSummary = item.summary.toLowerCase();

  // 1. Exact Match Relevance (max 30 pts)
  if (lowerTitle.includes(lowerQuery)) {
    score += 30;
    matchDetails.push('Exact Title Match (+30)');
  } else if (lowerSummary.includes(lowerQuery)) {
    score += 15;
    matchDetails.push('Summary Keyword Match (+15)');
  }

  // 2. Verification Status Weight (max 40 pts)
  if (item.verificationStatus === 'VERIFIED') {
    score += 40;
    matchDetails.push('Peer-Verified Status (+40)');
  } else if (item.verificationStatus === 'SUBMITTED' || item.verificationStatus === 'UNDER_REVIEW') {
    score += 20;
    matchDetails.push('In Review Desk (+20)');
  }

  // 3. Confidence / Trust Score Weight (max 15 pts)
  const trustWeight = Math.round((item.confidenceScore / 100) * 15);
  score += trustWeight;
  matchDetails.push(`Trust Score Weight (+${trustWeight})`);

  // 4. Evidence Support Strength (max 15 pts)
  const evidenceWeight = Math.min(15, item.evidenceCount * 5);
  score += evidenceWeight;
  matchDetails.push(`Evidence Backing (+${evidenceWeight})`);

  return {
    score: Math.min(100, score),
    explanation: matchDetails.join(' • '),
  };
}
