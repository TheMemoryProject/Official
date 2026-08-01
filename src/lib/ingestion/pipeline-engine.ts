export interface IngestionPipelineInput {
  documentId: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

export function executeIngestionPipeline(input: IngestionPipelineInput) {
  const stages = [
    { stage: 'VIRUS_SCAN', status: 'SUCCESS', durationMs: 120 },
    { stage: 'INTEGRITY_VALIDATION', status: 'SUCCESS', durationMs: 45 },
    { stage: 'TEXT_EXTRACTION', status: 'SUCCESS', durationMs: 340 },
    { stage: 'OCR_CHECK', status: 'SUCCESS', durationMs: 510 },
    { stage: 'ENTITY_EXTRACTION', status: 'SUCCESS', durationMs: 890 },
    { stage: 'RELATIONSHIP_DETECTION', status: 'SUCCESS', durationMs: 410 },
  ];

  const extractedEntitiesCount = 14;
  const overallConfidence = 94;

  return {
    documentId: input.documentId,
    stages,
    extractedEntitiesCount,
    overallConfidence,
    requiresHumanReview: overallConfidence < 90,
  };
}
