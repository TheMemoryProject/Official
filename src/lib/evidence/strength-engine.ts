export interface EvidenceFactors {
  isIndependentAudit?: boolean;
  isProductionValidated?: boolean;
  hasStandardsReference?: boolean;
  hasPeerReviewedPaper?: boolean;
  hasSampleCalibrationData?: boolean;
  isRepeatableTest?: boolean;
  hasOpenRawLogs?: boolean;
}

export function calculateEvidenceStrength(factors: EvidenceFactors): {
  score: number;
  rating: 'VERIFIED_EXCELLENT' | 'HIGH' | 'MODERATE' | 'BASIC';
  breakdown: Array<{ factor: string; points: number; description: string }>;
} {
  let score = 40; // Base documentation score
  const breakdown = [{ factor: 'Base Documentation', points: 40, description: 'Structured technical summary provided' }];

  if (factors.isIndependentAudit) {
    score += 15;
    breakdown.push({ factor: 'Third-Party Audit', points: 15, description: 'Verified by independent lab audit' });
  }

  if (factors.isProductionValidated) {
    score += 15;
    breakdown.push({ factor: 'Production Validated', points: 15, description: 'Physical test data vs. simulation only' });
  }

  if (factors.hasStandardsReference) {
    score += 10;
    breakdown.push({ factor: 'Standards Compliance', points: 10, description: 'Direct reference to ISO/ASME/ASTM standards' });
  }

  if (factors.hasPeerReviewedPaper) {
    score += 10;
    breakdown.push({ factor: 'Peer Reviewed', points: 10, description: 'Published paper, DOI, or patent number' });
  }

  if (factors.hasSampleCalibrationData) {
    score += 5;
    breakdown.push({ factor: 'Equipment Calibration', points: 5, description: 'Calibrated sensor logs attached' });
  }

  if (factors.hasOpenRawLogs) {
    score += 5;
    breakdown.push({ factor: 'Open Raw Logs', points: 5, description: 'Unredacted raw test data included' });
  }

  score = Math.min(100, Math.max(0, score));

  let rating: 'VERIFIED_EXCELLENT' | 'HIGH' | 'MODERATE' | 'BASIC' = 'BASIC';
  if (score >= 90) rating = 'VERIFIED_EXCELLENT';
  else if (score >= 75) rating = 'HIGH';
  else if (score >= 60) rating = 'MODERATE';

  return { score, rating, breakdown };
}
