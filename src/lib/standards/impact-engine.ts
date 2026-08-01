export interface ChangeImpactAnalysisResult {
  standardId: string;
  standardNumber: string;
  oldRevision: string;
  newRevision: string;
  affectedKnowledgeCount: number;
  affectedFailuresCount: number;
  affectedEvidenceCount: number;
  impactSummary: string;
  actionItems: Array<{
    targetType: 'KNOWLEDGE' | 'FAILURE' | 'EVIDENCE' | 'MATERIAL' | 'PROCESS';
    targetId: string;
    title: string;
    actionRequired: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  requiresHumanReview: boolean;
}

export function calculateStandardChangeImpact(
  standard: {
    id: string;
    standardNumber: string;
    revision: string;
  },
  newRevision: string,
  associatedMappings: Array<{
    knowledgeEntry?: { id: string; title: string } | null;
    failureRecord?: { id: string; title: string } | null;
    evidenceRecord?: { id: string; title: string } | null;
  }>
): ChangeImpactAnalysisResult {
  const actionItems: ChangeImpactAnalysisResult['actionItems'] = [];

  associatedMappings.forEach((m) => {
    if (m.knowledgeEntry) {
      actionItems.push({
        targetType: 'KNOWLEDGE',
        targetId: m.knowledgeEntry.id,
        title: m.knowledgeEntry.title,
        actionRequired: `Review compliance verification against new standard revision (${newRevision})`,
        urgency: 'HIGH',
      });
    }
    if (m.failureRecord) {
      actionItems.push({
        targetType: 'FAILURE',
        targetId: m.failureRecord.id,
        title: m.failureRecord.title,
        actionRequired: `Audit corrective/preventive actions against updated standard clauses`,
        urgency: 'HIGH',
      });
    }
    if (m.evidenceRecord) {
      actionItems.push({
        targetType: 'EVIDENCE',
        targetId: m.evidenceRecord.id,
        title: m.evidenceRecord.title,
        actionRequired: `Re-evaluate empirical test report calibration against updated standard specification`,
        urgency: 'MEDIUM',
      });
    }
  });

  const affectedKnowledgeCount = associatedMappings.filter((m) => m.knowledgeEntry).length;
  const affectedFailuresCount = associatedMappings.filter((m) => m.failureRecord).length;
  const affectedEvidenceCount = associatedMappings.filter((m) => m.evidenceRecord).length;

  const impactSummary = `Updating ${standard.standardNumber} from ${standard.revision} to ${newRevision} affects ${affectedKnowledgeCount} Knowledge Entries, ${affectedFailuresCount} Failure Records, and ${affectedEvidenceCount} Empirical Evidence items. Mandatory human audit required.`;

  return {
    standardId: standard.id,
    standardNumber: standard.standardNumber,
    oldRevision: standard.revision,
    newRevision,
    affectedKnowledgeCount,
    affectedFailuresCount,
    affectedEvidenceCount,
    impactSummary,
    actionItems,
    requiresHumanReview: true,
  };
}
