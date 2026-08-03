import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// KTN INNOVATION ENGINE
//
// Every subsystem (knowledge, problems, solutions, failures, evidence,
// standards, graph, translations) is an input. The engine continuously
// recomputes candidate discoveries: solution transfers, engineering
// analogies, hidden relationships, recurring failure mechanisms, knowledge
// gaps, emerging themes, and innovation recommendations.
//
// Candidates are NEVER asserted as truth. They are surfaced as opportunities
// that require human verification.
// ---------------------------------------------------------------------------

export type OpportunityKind =
  | 'TRANSFER'
  | 'ANALOGY'
  | 'SIMILAR_PROBLEM'
  | 'HIDDEN_RELATIONSHIP'
  | 'GAP'
  | 'RECURRING_FAILURE'
  | 'EMERGING_THEME'
  | 'RECOMMENDATION';

export interface InnovationOpportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  description: string;
  explanation: string;
  confidence: number;
  sourceDomain?: string;
  targetDomain?: string;
  sourceIndustry?: string;
  targetIndustry?: string;
  sourceId?: string;
  targetId?: string;
  evidence?: string[];
  requiresVerification: boolean;
}

export interface InnovationMetric {
  code: string;
  label: string;
  value: number;
  description: string;
}

export interface InnovationExpert {
  id: string;
  name: string;
  title: string;
  role: string;
  domain: string;
  knowledgeCount: number;
}

export interface InnovationDashboardData {
  generatedAt: string;
  summary: string;
  metrics: InnovationMetric[];
  crossDomainTransfers: InnovationOpportunity[];
  hiddenRelationships: InnovationOpportunity[];
  analogies: InnovationOpportunity[];
  similarProblems: InnovationOpportunity[];
  recurringFailures: InnovationOpportunity[];
  knowledgeGaps: InnovationOpportunity[];
  emergingThemes: InnovationOpportunity[];
  recommendations: InnovationOpportunity[];
  experts: InnovationExpert[];
  totals: {
    knowledge: number;
    problems: number;
    solutions: number;
    failures: number;
    evidence: number;
    standards: number;
    translations: number;
    unverifiedEdges: number;
  };
}

const PHYSICS_KEYWORDS = [
  'fatigue',
  'heat',
  'thermal',
  'corrosion',
  'calibration',
  'contamination',
  'particle',
  'residual stress',
  'phase change',
  'phase-change',
  'metrology',
  'consensus',
  'scheduling',
  'delamination',
  'runaway',
  'vibration',
  'alignment',
  'sterilization',
  'cathodic protection',
  'galvanic',
  'drift',
  'backlash',
  'quorum',
];

const FAILURE_SIGNALS = [
  'fatigue',
  'corrosion',
  'thermal',
  'contamination',
  'particulate',
  'delamination',
  'runaway',
  'drift',
  'crack',
  'pitting',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sharedKeywords(a: string, b: string): string[] {
  const setA = new Set(
    PHYSICS_KEYWORDS.filter((k) => a.toLowerCase().includes(k))
  );
  return PHYSICS_KEYWORDS.filter((k) => setA.has(k) && b.toLowerCase().includes(k));
}

function confidenceFor(shared: string[], base = 55): number {
  const score = base + shared.length * 7;
  return Math.min(97, Math.max(40, score));
}

// ---------------------------------------------------------------------------
// SECTION COMPUTATIONS
// ---------------------------------------------------------------------------

interface KnowledgeRow {
  id: string;
  title: string;
  problemSummary: string;
  solutionSummary: string;
  technicalExplanation: string;
  knownConstraints: string | null;
  failureModes: string | null;
  domain: { id: string; name: string };
  industry: { id: string; name: string };
  creator: { id: string; fullName: string; title: string | null };
  verifiedAt: Date | null;
}

interface ProblemRow {
  id: string;
  title: string;
  description: string;
  severity: string;
  domain: { id: string; name: string };
  industry: { id: string; name: string };
  _count: { solutions: number };
}

function computeCrossDomainTransfers(knowledge: KnowledgeRow[]): InnovationOpportunity[] {
  const opportunities: InnovationOpportunity[] = [];
  for (let i = 0; i < knowledge.length; i++) {
    for (let j = i + 1; j < knowledge.length; j++) {
      const a = knowledge[i];
      const b = knowledge[j];
      if (a.domain.id === b.domain.id) continue;
      const shared = sharedKeywords(
        `${a.title} ${a.technicalExplanation}`,
        `${b.title} ${b.technicalExplanation}`
      );
      if (shared.length === 0) continue;
      const confidence = confidenceFor(shared, 62);
      opportunities.push({
        id: `transfer-${a.id.slice(0, 8)}-${b.id.slice(0, 8)}`,
        kind: 'TRANSFER',
        title: `Transfer ${b.title} to ${a.domain.name}`,
        description: `${a.title} and ${b.title} share ${shared.join(', ')} but live in different domains (${a.domain.name} vs ${b.domain.name}).`,
        explanation: `Both knowledge objects are governed by the same physics (${shared.join(', ')}). Engineering knowledge from ${b.domain.name} / ${b.industry.name} may solve problems in ${a.domain.name} / ${a.industry.name}.`,
        confidence,
        sourceDomain: b.domain.name,
        targetDomain: a.domain.name,
        sourceIndustry: b.industry.name,
        targetIndustry: a.industry.name,
        sourceId: b.id,
        targetId: a.id,
        evidence: [b.technicalExplanation.slice(0, 160), a.technicalExplanation.slice(0, 160)],
        requiresVerification: true,
      });
    }
  }
  return opportunities
    .sort((x, y) => y.confidence - x.confidence)
    .slice(0, 12);
}

function computeAnalogies(knowledge: KnowledgeRow[]): InnovationOpportunity[] {
  const opportunities: InnovationOpportunity[] = [];
  for (let i = 0; i < knowledge.length; i++) {
    for (let j = i + 1; j < knowledge.length; j++) {
      const a = knowledge[i];
      const b = knowledge[j];
      if (a.domain.id === b.domain.id) continue;
      const shared = sharedKeywords(
        `${a.title} ${a.failureModes ?? ''} ${a.technicalExplanation}`,
        `${b.title} ${b.failureModes ?? ''} ${b.technicalExplanation}`
      );
      if (shared.length === 0) continue;
      const confidence = confidenceFor(shared, 50);
      opportunities.push({
        id: `analogy-${a.id.slice(0, 8)}-${b.id.slice(0, 8)}`,
        kind: 'ANALOGY',
        title: `Engineering analogy: ${a.title}`,
        description: `Structural/functional/physics analogy detected between ${a.domain.name} and ${b.domain.name}.`,
        explanation: `Both systems share physics: ${shared.join(', ')}. The failure-avoidance logic of one may be reusable in the other even though the components differ.`,
        confidence,
        sourceDomain: a.domain.name,
        targetDomain: b.domain.name,
        sourceIndustry: a.industry.name,
        targetIndustry: b.industry.name,
        sourceId: a.id,
        targetId: b.id,
        evidence: [`${a.title} (${a.domain.name})`, `${b.title} (${b.domain.name})`],
        requiresVerification: true,
      });
    }
  }
  return opportunities
    .sort((x, y) => y.confidence - x.confidence)
    .slice(0, 12);
}

function computeSimilarProblems(problems: ProblemRow[]): InnovationOpportunity[] {
  const opportunities: InnovationOpportunity[] = [];
  for (let i = 0; i < problems.length; i++) {
    for (let j = i + 1; j < problems.length; j++) {
      const a = problems[i];
      const b = problems[j];
      if (a.domain.id === b.domain.id) continue;
      const text = `${a.title} ${a.description}`;
      const other = `${b.title} ${b.description}`;
      const signals = FAILURE_SIGNALS.filter((s) => text.toLowerCase().includes(s) && other.toLowerCase().includes(s));
      if (signals.length === 0) continue;
      const confidence = confidenceFor(signals, 60);
      opportunities.push({
        id: `similar-problem-${a.id.slice(0, 8)}-${b.id.slice(0, 8)}`,
        kind: 'SIMILAR_PROBLEM',
        title: `Similar problems solved independently: ${signals.join(', ')}`,
        description: `${a.title} (${a.domain.name}) and ${b.title} (${b.domain.name}) were likely solved independently.`,
        explanation: `Both problem statements share failure signals (${signals.join(', ')}). One verified solution may be reusable for the other, preventing duplicated engineering effort.`,
        confidence,
        sourceDomain: a.domain.name,
        targetDomain: b.domain.name,
        sourceIndustry: a.industry.name,
        targetIndustry: b.industry.name,
        sourceId: a.id,
        targetId: b.id,
        evidence: [a.severity, b.severity],
        requiresVerification: true,
      });
    }
  }
  return opportunities
    .sort((x, y) => y.confidence - x.confidence)
    .slice(0, 12);
}

function computeRecurringFailures(failures: Array<{ id: string; title: string; phenomenon: string; rootCause: string; domain: { name: string } }>): InnovationOpportunity[] {
  const groups = new Map<string, Array<typeof failures[number]>>();
  for (const f of failures) {
    const text = `${f.title} ${f.phenomenon} ${f.rootCause}`.toLowerCase();
    for (const signal of FAILURE_SIGNALS) {
      if (text.includes(signal)) {
        if (!groups.has(signal)) groups.set(signal, []);
        groups.get(signal)!.push(f);
        break;
      }
    }
  }
  const opportunities: InnovationOpportunity[] = [];
  for (const [signal, list] of groups) {
    if (list.length < 2) continue;
    const domains = [...new Set(list.map((f) => f.domain.name))];
    opportunities.push({
      id: `recurring-${slugify(signal)}`,
      kind: 'RECURRING_FAILURE',
      title: `Recurring failure mechanism: ${signal}`,
      description: `${list.length} failures share the same root mechanism '${signal}' across ${domains.join(', ')}.`,
      explanation: `When multiple failures share an identical root mechanism, a single verified prevention strategy can eliminate risk across all affected domains. Investigate a shared mitigation.`,
      confidence: 78 + Math.min(list.length * 3, 15),
      sourceDomain: domains.join(', '),
      targetDomain: undefined,
      evidence: list.map((f) => f.title),
      requiresVerification: true,
    });
  }
  return opportunities.sort((x, y) => y.confidence - x.confidence);
}

function computeKnowledgeGaps(
  failures: Array<{ id: string; title: string; verifiedSolutionId: string | null; domain: { name: string } }>,
  problems: ProblemRow[],
  knowledge: KnowledgeRow[],
  standards: Array<{ id: string }>,
  translations: Array<{ sourceKnowledgeId: string; targetKnowledgeId: string }>
): InnovationOpportunity[] {
  const opportunities: InnovationOpportunity[] = [];

  for (const f of failures) {
    if (!f.verifiedSolutionId) {
      opportunities.push({
        id: `gap-failure-${f.id.slice(0, 8)}`,
        kind: 'GAP',
        title: 'Failure with no verified solution',
        description: `'${f.title}' (${f.domain.name}) has no verified solution linked.`,
        explanation: 'We have the failure knowledge but no verified corrective path. This is a prime innovation opportunity: engineer a solution and verify it.',
        confidence: 80,
        sourceDomain: f.domain.name,
        sourceId: f.id,
        requiresVerification: false,
      });
    }
  }

  for (const p of problems) {
    if (p._count.solutions === 0) {
      opportunities.push({
        id: `gap-problem-${p.id.slice(0, 8)}`,
        kind: 'GAP',
        title: 'Unsolved engineering problem',
        description: `'${p.title}' (${p.domain.name}) has no verified solutions.`,
        explanation: 'An unsolved, scoped problem statement exists with no accepted answer. Reuse from another domain or initiate a solution effort.',
        confidence: 75,
        sourceDomain: p.domain.name,
        sourceId: p.id,
        requiresVerification: false,
      });
    }
  }

  const translatedIds = new Set(translations.flatMap((t) => [t.sourceKnowledgeId, t.targetKnowledgeId]));
  for (const k of knowledge) {
    if (!translatedIds.has(k.id)) {
      opportunities.push({
        id: `gap-translation-${k.id.slice(0, 8)}`,
        kind: 'GAP',
        title: 'Knowledge never explored for transfer',
        description: `'${k.title}' (${k.domain.name}) has never been translated into another domain.`,
        explanation: 'Verified knowledge that has not been assessed for cross-domain reuse may hide unclaimed innovation value. Run the translation engine on this object.',
        confidence: 65,
        sourceDomain: k.domain.name,
        sourceId: k.id,
        requiresVerification: false,
      });
    }
  }

  if (standards.length === 0) {
    opportunities.push({
      id: 'gap-standard',
      kind: 'GAP',
      title: 'No engineering standard linked',
      description: 'No engineering standard is linked to any knowledge object.',
      explanation: 'Verified knowledge without standard linkage is at compliance risk. Map governing standards to knowledge objects.',
      confidence: 70,
      requiresVerification: false,
    });
  }

  return opportunities.slice(0, 12);
}

function computeHiddenRelationships(
  knowledge: KnowledgeRow[],
  unverifiedEdges: Array<{ id: string; confidence: number; sourceNode: { name: string }; targetNode: { name: string } }>,
  existing: Set<string>
): InnovationOpportunity[] {
  const opportunities: InnovationOpportunity[] = [];
  for (const edge of unverifiedEdges) {
    opportunities.push({
      id: `edge-${edge.id.slice(0, 8)}`,
      kind: 'HIDDEN_RELATIONSHIP',
      title: `Candidate relationship: ${edge.sourceNode.name} → ${edge.targetNode.name}`,
      description: 'A low-confidence graph relationship was generated automatically and is awaiting human verification.',
      explanation: 'The engine proposes this connection based on graph structure. Verify before asserting it as truth.',
      confidence: edge.confidence,
      requiresVerification: true,
    });
  }

  // Candidate relationships the engine computes itself (not yet in the graph).
  for (let i = 0; i < knowledge.length; i++) {
    for (let j = i + 1; j < knowledge.length; j++) {
      const a = knowledge[i];
      const b = knowledge[j];
      if (a.domain.id === b.domain.id) continue;
      const keyA = `${a.id}|${b.id}`;
      const keyB = `${b.id}|${a.id}`;
      if (existing.has(keyA) || existing.has(keyB)) continue;
      const shared = sharedKeywords(`${a.title} ${a.failureModes ?? ''}`, `${b.title} ${b.failureModes ?? ''}`);
      if (shared.length === 0) continue;
      opportunities.push({
        id: `candidate-edge-${a.id.slice(0, 8)}-${b.id.slice(0, 8)}`,
        kind: 'HIDDEN_RELATIONSHIP',
        title: `Hidden relationship: ${a.title} ⟷ ${b.title}`,
        description: `The engine detected a plausible connection between ${a.domain.name} and ${b.domain.name} knowledge that is not yet stored in the graph.`,
        explanation: `Shared physics (${shared.join(', ')}) suggests a relationship the graph does not yet model. Present as an opportunity for verification.`,
        confidence: confidenceFor(shared, 50),
        sourceDomain: a.domain.name,
        targetDomain: b.domain.name,
        sourceId: a.id,
        targetId: b.id,
        requiresVerification: true,
      });
    }
  }

  return opportunities.sort((x, y) => y.confidence - x.confidence).slice(0, 12);
}

function computeEmergingThemes(knowledge: KnowledgeRow[], graphNodes: Array<{ name: string; nodeType: string }>): InnovationOpportunity[] {
  const counts = new Map<string, { count: number; domains: Set<string> }>();
  for (const k of knowledge) {
    const text = `${k.title} ${k.technicalExplanation} ${k.failureModes ?? ''}`.toLowerCase();
    for (const kw of PHYSICS_KEYWORDS) {
      if (text.includes(kw)) {
        if (!counts.has(kw)) counts.set(kw, { count: 0, domains: new Set() });
        counts.get(kw)!.count += 1;
        counts.get(kw)!.domains.add(k.domain.name);
      }
    }
  }
  const themes: InnovationOpportunity[] = [];
  for (const [theme, info] of counts) {
    if (info.count < 2) continue;
    themes.push({
      id: `theme-${slugify(theme)}`,
      kind: 'EMERGING_THEME',
      title: `Emerging theme: ${theme}`,
      description: `'${theme}' appears in ${info.count} knowledge objects across ${info.domains.size} domains (${[...info.domains].join(', ')}).`,
      explanation: `A physics theme recurs across domains, signalling where cross-industry knowledge transfer is most likely to pay off.`,
      confidence: 60 + info.count * 3,
      sourceDomain: [...info.domains].join(', '),
      requiresVerification: false,
    });
  }
  return themes.sort((x, y) => y.confidence - x.confidence).slice(0, 8);
}

function computeRecommendations(
  transfers: InnovationOpportunity[],
  analogies: InnovationOpportunity[],
  hidden: InnovationOpportunity[],
  gaps: InnovationOpportunity[],
  experts: InnovationExpert[]
): InnovationOpportunity[] {
  const recommendations: InnovationOpportunity[] = [];

  for (const t of transfers.slice(0, 3)) {
    recommendations.push({
      ...t,
      kind: 'RECOMMENDATION',
      id: `rec-transfer-${t.id}`,
      title: `Innovation transfer: ${t.sourceDomain ?? ''} → ${t.targetDomain ?? ''}`,
      description: `Recommend reviewing ${t.description}`,
      explanation: `Evidence-backed candidate: reuse ${t.sourceId ?? ''} verified knowledge in ${t.targetDomain}.`,
      requiresVerification: true,
    });
  }

  for (const a of analogies.slice(0, 3)) {
    const candidateExpert = experts.find((e) => e.domain.toLowerCase().includes((a.targetDomain ?? '').toLowerCase()));
    recommendations.push({
      ...a,
      kind: 'RECOMMENDATION',
      id: `rec-analogy-${a.id}`,
      title: `Potential collaborator pair: ${a.sourceDomain} + ${a.targetDomain}`,
      description: candidateExpert
        ? `Connect the ${a.sourceDomain} owner with ${candidateExpert.name} (${candidateExpert.domain}) to explore ${a.title}.`
        : `Explore ${a.title} jointly across ${a.sourceDomain} and ${a.targetDomain}.`,
      explanation: `Combining engineering knowledge from ${a.sourceDomain} and ${a.targetDomain} may yield novel solutions.`,
      requiresVerification: true,
    });
  }

  for (const g of gaps.slice(0, 2)) {
    recommendations.push({
      ...g,
      kind: 'RECOMMENDATION',
      id: `rec-gap-${g.id}`,
      title: `Research direction: close the gap '${g.title}'`,
      description: g.description,
      explanation: g.explanation,
      requiresVerification: false,
    });
  }

  for (const h of hidden.slice(0, 2)) {
    recommendations.push({
      ...h,
      kind: 'RECOMMENDATION',
      id: `rec-hidden-${h.id}`,
      title: `Verify hidden connection: ${h.title}`,
      description: h.description,
      explanation: h.explanation,
      requiresVerification: true,
    });
  }

  return recommendations.slice(0, 10);
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getInnovationDashboard(): Promise<InnovationDashboardData> {
  const [
    knowledge,
    problems,
    failures,
    graphNodes,
    unverifiedEdges,
    standards,
    translations,
  ] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      where: { deletedAt: null },
      include: {
        domain: { select: { id: true, name: true } },
        industry: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true, title: true } },
      },
    }),
    prisma.engineeringProblem.findMany({
      where: { deletedAt: null },
      include: {
        domain: { select: { id: true, name: true } },
        industry: { select: { id: true, name: true } },
        _count: { select: { solutions: true } },
      },
    }),
    prisma.failureRecord.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        phenomenon: true,
        rootCause: true,
        verifiedSolutionId: true,
        domain: { select: { id: true, name: true } },
      },
    }),
    prisma.graphNode.findMany({ select: { name: true, nodeType: true } }),
    prisma.graphEdge.findMany({
      where: { verificationStatus: 'UNVERIFIED' },
      select: {
        id: true,
        confidence: true,
        sourceNode: { select: { name: true } },
        targetNode: { select: { name: true } },
      },
    }),
    prisma.standardRecord.findMany({ select: { id: true } }),
    prisma.knowledgeTranslation.findMany({
      select: { sourceKnowledgeId: true, targetKnowledgeId: true },
    }),
  ]);

  const evidenceCount = await prisma.evidenceRecord.count({ where: { deletedAt: null } });

  const transfers = computeCrossDomainTransfers(knowledge as KnowledgeRow[]);
  const analogies = computeAnalogies(knowledge as KnowledgeRow[]);
  const similarProblems = computeSimilarProblems(problems as ProblemRow[]);
  const recurringFailures = computeRecurringFailures(failures);
  const knowledgeGaps = computeKnowledgeGaps(
    failures,
    problems as ProblemRow[],
    knowledge as KnowledgeRow[],
    standards,
    translations
  );

  const existing = new Set(translations.flatMap((t) => [`${t.sourceKnowledgeId}|${t.targetKnowledgeId}`, `${t.targetKnowledgeId}|${t.sourceKnowledgeId}`]));
  const hiddenRelationships = computeHiddenRelationships(knowledge as KnowledgeRow[], unverifiedEdges, existing);
  const emergingThemes = computeEmergingThemes(knowledge as KnowledgeRow[], graphNodes);

  // Expertise network: top contributor per domain.
  const expertMap = new Map<string, InnovationExpert>();
  for (const k of knowledge) {
    const creatorId = k.creator.id;
    const domain = k.domain.name;
    const existingExpert = expertMap.get(creatorId);
    if (existingExpert) {
      if (existingExpert.domain !== domain) {
        existingExpert.domain = `${existingExpert.domain}, ${domain}`;
      }
      existingExpert.knowledgeCount += 1;
    } else {
      expertMap.set(creatorId, {
        id: creatorId,
        name: k.creator.fullName,
        title: k.creator.title ?? 'Engineer',
        role: 'CONTRIBUTOR',
        domain,
        knowledgeCount: 1,
      });
    }
  }
  const experts = [...expertMap.values()].sort((a, b) => b.knowledgeCount - a.knowledgeCount);

  const recommendations = computeRecommendations(transfers, analogies, hiddenRelationships, knowledgeGaps, experts);

  const metrics: InnovationMetric[] = [
    { code: 'SOLUTIONS_REUSED', label: 'Engineering Solutions Reused', value: translations.length, description: 'Verified solution transfers accepted across domains.' },
    { code: 'DUPLICATION_PREVENTED', label: 'Duplicated Work Prevented', value: similarProblems.length, description: 'Similar-problem pairs surfaced before independent re-solving.' },
    { code: 'CROSS_DOMAIN_DISCOVERIES', label: 'Cross-Domain Discoveries', value: transfers.length + analogies.length, description: 'Candidate solution transfers & analogies between industries.' },
    { code: 'HIDDEN_RELATIONSHIPS', label: 'Hidden Relationships', value: hiddenRelationships.length, description: 'Candidate relationships awaiting human verification.' },
    { code: 'KNOWLEDGE_GAPS', label: 'Knowledge Gaps', value: knowledgeGaps.length, description: 'Failures unsolved, knowledge untranslated, standards unlinked.' },
    { code: 'OPPORTUNITIES_SURFACED', label: 'Innovation Opportunities', value: recommendations.length, description: 'Actionable innovation recommendations generated.' },
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: `${knowledge.length} verified knowledge objects across ${new Set(knowledge.map((k) => k.domain.name)).size} domains and ${new Set(knowledge.map((k) => k.industry.name)).size} industries. ${transfers.length} cross-domain candidates and ${hiddenRelationships.length} hidden relationships surfaced.`,
    metrics,
    crossDomainTransfers: transfers,
    hiddenRelationships,
    analogies,
    similarProblems,
    recurringFailures,
    knowledgeGaps,
    emergingThemes,
    recommendations,
    experts,
    totals: {
      knowledge: knowledge.length,
      problems: problems.length,
      solutions: await prisma.verifiedSolution.count({ where: { deletedAt: null } }),
      failures: failures.length,
      evidence: evidenceCount,
      standards: standards.length,
      translations: translations.length,
      unverifiedEdges: unverifiedEdges.length,
    },
  };
}
