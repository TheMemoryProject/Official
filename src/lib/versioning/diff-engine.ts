export interface FieldDiff {
  fieldName: string;
  previousValue: string;
  newValue: string;
  changeType: 'MODIFIED' | 'ADDED' | 'REMOVED' | 'UNCHANGED';
}

export interface VersionComparisonResult {
  v1Version: number;
  v2Version: number;
  diffs: FieldDiff[];
  totalChanges: number;
  hasCriticalChange: boolean;
}

export function compareKnowledgeVersions(
  snapshotV1: Record<string, any>,
  snapshotV2: Record<string, any>
): VersionComparisonResult {
  const diffs: FieldDiff[] = [];
  let hasCriticalChange = false;

  const allKeys = Array.from(new Set([...Object.keys(snapshotV1), ...Object.keys(snapshotV2)]));

  for (const key of allKeys) {
    const val1 = snapshotV1[key] ? String(snapshotV1[key]) : '';
    const val2 = snapshotV2[key] ? String(snapshotV2[key]) : '';

    if (!val1 && val2) {
      diffs.push({
        fieldName: key,
        previousValue: 'N/A',
        newValue: val2,
        changeType: 'ADDED',
      });
    } else if (val1 && !val2) {
      diffs.push({
        fieldName: key,
        previousValue: val1,
        newValue: 'N/A',
        changeType: 'REMOVED',
      });
    } else if (val1 !== val2) {
      if (key === 'verificationStatus' || key === 'knownConstraints' || key === 'failureModes') {
        hasCriticalChange = true;
      }
      diffs.push({
        fieldName: key,
        previousValue: val1,
        newValue: val2,
        changeType: 'MODIFIED',
      });
    }
  }

  return {
    v1Version: snapshotV1.version || 1,
    v2Version: snapshotV2.version || 2,
    diffs,
    totalChanges: diffs.length,
    hasCriticalChange,
  };
}
