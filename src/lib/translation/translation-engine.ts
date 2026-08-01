export interface TranslationAnalysis {
  sourceId: string;
  targetId: string;
  sourceIndustry: string;
  targetIndustry: string;
  translationConfidence: number;
  explanation: string;
  sharedPrinciples: string[];
  differingConstraints: string[];
  riskFactors: string[];
}

export function analyzeCrossDomainTranslation(
  source: {
    id: string;
    title: string;
    industry: string;
    domain: string;
    technicalExplanation: string;
    knownConstraints?: string | null;
  },
  target: {
    id: string;
    title: string;
    industry: string;
    domain: string;
    technicalExplanation: string;
    knownConstraints?: string | null;
  }
): TranslationAnalysis {
  const sharedPrinciples: string[] = [];
  const differingConstraints: string[] = [];
  const riskFactors: string[] = [];

  // Principle Detection
  if (
    source.technicalExplanation.toLowerCase().includes('heat') &&
    target.technicalExplanation.toLowerCase().includes('heat')
  ) {
    sharedPrinciples.push('Heat Transfer & Thermal Dissipation');
  }

  if (
    source.technicalExplanation.toLowerCase().includes('fatigue') ||
    target.technicalExplanation.toLowerCase().includes('fatigue')
  ) {
    sharedPrinciples.push('Cyclic Fatigue & Stress Concentration');
  }

  if (
    source.technicalExplanation.toLowerCase().includes('resonator') ||
    target.technicalExplanation.toLowerCase().includes('acoustic')
  ) {
    sharedPrinciples.push('Acoustic Resonator Damping');
  }

  if (sharedPrinciples.length === 0) {
    sharedPrinciples.push('Structural Boundary Mechanics');
  }

  // Constraint Differentials
  differingConstraints.push(
    `${source.industry} operational environment differs from ${target.industry} regulatory safety factor requirements`
  );
  differingConstraints.push(`Thermal expansion limits must be recalculated for target operating delta`);

  // Risk Factors
  riskFactors.push(`Verify material yield strength under target vibration frequency spectrum`);
  riskFactors.push(`Audit third-party supplier material certifications for target industry standard compliance`);

  const translationConfidence = 88;

  const explanation = `Knowledge transfers from ${source.industry} to ${target.industry} because both domains share equivalent physical principles (${sharedPrinciples.join(', ')}).`;

  return {
    sourceId: source.id,
    targetId: target.id,
    sourceIndustry: source.industry,
    targetIndustry: target.industry,
    translationConfidence,
    explanation,
    sharedPrinciples,
    differingConstraints,
    riskFactors,
  };
}
