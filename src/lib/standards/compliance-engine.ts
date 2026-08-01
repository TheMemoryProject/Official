export interface ComplianceMatrixItem {
  id: string;
  knowledgeTitle: string;
  standardNumber: string;
  clauseIdentifier: string;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'UNDER_REVIEW' | 'MISSING_EVIDENCE' | 'NOT_APPLICABLE';
  verificationStatus: string;
  reviewerName: string;
  hasEvidence: boolean;
  openIssues?: string | null;
}

export function evaluateComplianceReadiness(items: ComplianceMatrixItem[]): {
  readinessPercentage: number;
  totalMapped: number;
  compliantCount: number;
  missingEvidenceCount: number;
  nonCompliantCount: number;
  rating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
} {
  const totalMapped = items.length;
  if (totalMapped === 0) {
    return {
      readinessPercentage: 100,
      totalMapped: 0,
      compliantCount: 0,
      missingEvidenceCount: 0,
      nonCompliantCount: 0,
      rating: 'EXCELLENT',
    };
  }

  const compliantCount = items.filter((i) => i.complianceStatus === 'COMPLIANT').length;
  const missingEvidenceCount = items.filter((i) => i.complianceStatus === 'MISSING_EVIDENCE').length;
  const nonCompliantCount = items.filter((i) => i.complianceStatus === 'NON_COMPLIANT').length;

  const readinessPercentage = Math.round((compliantCount / totalMapped) * 100);

  let rating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'EXCELLENT';
  if (readinessPercentage < 70) rating = 'CRITICAL';
  else if (readinessPercentage < 85) rating = 'NEEDS_ATTENTION';
  else if (readinessPercentage < 95) rating = 'GOOD';

  return {
    readinessPercentage,
    totalMapped,
    compliantCount,
    missingEvidenceCount,
    nonCompliantCount,
    rating,
  };
}
