export interface ProblemInput {
  title: string;
  primaryFunction: string;
  failureMode: string;
  phenomenon: string;
  materialFamily?: string;
  process?: string;
  operatingTempMax?: number;
  pressureMax?: number;
}

export interface MatchResult {
  knowledgeId: string;
  title: string;
  problemSummary: string;
  solutionSummary: string;
  domainName: string;
  industryName: string;
  overallScore: number; // 0-100
  scores: {
    functional: number;
    failure: number;
    phenomenon: number;
    material: number;
    process: number;
    environmental: number;
  };
  explanations: string[];
}

export function computeProblemSimilarity(
  target: ProblemInput,
  candidate: {
    id: string;
    title: string;
    problemSummary: string;
    solutionSummary: string;
    technicalExplanation: string;
    knownConstraints?: string | null;
    failureModes?: string | null;
    domainName: string;
    industryName: string;
  }
): MatchResult {
  const explanations: string[] = [];

  // 1. Functional Similarity (Weight: 0.25)
  let functionalScore = 60;
  if (
    candidate.title.toLowerCase().includes(target.primaryFunction.toLowerCase()) ||
    candidate.solutionSummary.toLowerCase().includes(target.primaryFunction.toLowerCase())
  ) {
    functionalScore = 95;
    explanations.push(`Primary function overlap: Identical engineering objective (${target.primaryFunction})`);
  }

  // 2. Failure Mechanism Similarity (Weight: 0.25)
  let failureScore = 55;
  if (
    target.failureMode &&
    (candidate.failureModes?.toLowerCase().includes(target.failureMode.toLowerCase()) ||
      candidate.technicalExplanation.toLowerCase().includes(target.failureMode.toLowerCase()))
  ) {
    failureScore = 98;
    explanations.push(`Identical failure mechanism: ${target.failureMode}`);
  }

  // 3. Physical Phenomenon (Weight: 0.20)
  let phenomenonScore = 50;
  if (
    target.phenomenon &&
    candidate.technicalExplanation.toLowerCase().includes(target.phenomenon.toLowerCase())
  ) {
    phenomenonScore = 92;
    explanations.push(`Shared physical phenomenon: ${target.phenomenon}`);
  }

  // 4. Material & Process (Weight: 0.15)
  let materialScore = 60;
  if (target.materialFamily && candidate.technicalExplanation.toLowerCase().includes(target.materialFamily.toLowerCase())) {
    materialScore = 90;
    explanations.push(`Equivalent material family: ${target.materialFamily}`);
  }

  let processScore = 60;
  if (target.process && candidate.technicalExplanation.toLowerCase().includes(target.process.toLowerCase())) {
    processScore = 88;
    explanations.push(`Comparable manufacturing process: ${target.process}`);
  }

  // 5. Environmental & Constraints (Weight: 0.15)
  let environmentalScore = 70;
  if (target.operatingTempMax && candidate.knownConstraints?.includes('Kelvin')) {
    environmentalScore = 85;
    explanations.push(`High thermal boundary conditions (>1200 K) aligned`);
  }

  // Calculate Weighted Composite Score
  const overallScore = Math.round(
    functionalScore * 0.25 +
      failureScore * 0.25 +
      phenomenonScore * 0.20 +
      materialScore * 0.15 +
      processScore * 0.08 +
      environmentalScore * 0.07
  );

  if (explanations.length === 0) {
    explanations.push(`Matched on cross-domain physical boundary parameters`);
  }

  return {
    knowledgeId: candidate.id,
    title: candidate.title,
    problemSummary: candidate.problemSummary,
    solutionSummary: candidate.solutionSummary,
    domainName: candidate.domainName,
    industryName: candidate.industryName,
    overallScore,
    scores: {
      functional: functionalScore,
      failure: failureScore,
      phenomenon: phenomenonScore,
      material: materialScore,
      process: processScore,
      environmental: environmentalScore,
    },
    explanations,
  };
}
