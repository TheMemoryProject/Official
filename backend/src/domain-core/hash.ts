import { createHash } from 'node:crypto';

/** Content-addressable hashing: SHA-256 of a canonical UTF-8 string. */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Build a canonical content string from ordered key/value pairs. */
export function canonicalize(parts: Array<[string, string | number | boolean | null]>): string {
  return parts.map(([k, v]) => `${k}=${v ?? '∅'}`).join('|');
}

/** Content hash for a node: type + name + payload + ordered evidence hashes. */
export function nodeContentHash(
  name: string,
  nodeType: string,
  valueJson: string | null,
  evidenceHashes: string[]
): string {
  return sha256(canonicalize([
    ['name', name],
    ['type', nodeType],
    ['value', valueJson],
    ['evidence', evidenceHashes.join(',')],
  ]));
}

/** Content hash for an evidence span: full document/quote/claim/value/unit. */
export function spanContentHash(input: {
  documentRef: string;
  quote: string;
  claim: string;
  valueJson: string;
  unit: string | null;
}): string {
  return sha256(canonicalize([
    ['document', input.documentRef],
    ['quote', input.quote],
    ['claim', input.claim],
    ['value', input.valueJson],
    ['unit', input.unit],
  ]));
}
