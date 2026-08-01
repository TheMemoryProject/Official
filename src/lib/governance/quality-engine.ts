export interface QualityAssessmentInput {
  title: string;
  problemSummary: string;
  solutionSummary: string;
  technicalExplanation: string;
  verificationStatus: string;
  hasEvidence: boolean;
  hasStandards: boolean;
}

export function calculateKnowledgeQualityScore(input: QualityAssessmentInput) {
  let completenessScore = 0;
  if (input.title.length > 5) completenessScore += 25;
  if (input.problemSummary.length > 20) completenessScore += 25;
  if (input.solutionSummary.length > 20) completenessScore += 25;
  if (input.technicalExplanation.length > 30) completenessScore += 25;

  let evidenceScore = input.hasEvidence ? 95 : 40;
  let standardsScore = input.hasStandards ? 90 : 50;

  let verificationBonus = input.verificationStatus === 'VERIFIED' ? 100 : 60;

  const overallQualityScore = Math.round(
    completenessScore * 0.35 +
    evidenceScore * 0.25 +
    standardsScore * 0.20 +
    verificationBonus * 0.20
  );

  return {
    completenessScore,
    evidenceScore,
    standardsScore,
    overallQualityScore,
  };
}
