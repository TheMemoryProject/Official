import type { PrismaClient } from '@prisma/client';

/**
 * Synthetic fixtures for integration tests.
 *
 * Everything created here is prefixed SYNTHETIC so it is unmistakable in any database
 * it reaches. Per the directive, seed data must never resemble real customer
 * engineering data.
 */

export const SYNTHETIC_PREFIX = 'SYNTHETIC';

let counter = 0;
function uniq(label: string): string {
  counter += 1;
  return `${SYNTHETIC_PREFIX}-${label}-${counter}-${Date.now()}`;
}

export interface BaseFixtures {
  domainId: string;
  industryId: string;
  organizationId: string;
  authorId: string;
  reviewerId: string;
}

export async function createBaseFixtures(prisma: PrismaClient): Promise<BaseFixtures> {
  const org = await prisma.organization.create({
    data: { name: `${SYNTHETIC_PREFIX} Org`, slug: uniq('org').toLowerCase() },
  });

  const domain = await prisma.engineeringDomain.create({
    data: { name: uniq('Domain'), code: uniq('DOM').slice(0, 24) },
  });

  const industry = await prisma.industry.create({
    data: { name: uniq('Industry'), code: uniq('IND').slice(0, 24) },
  });

  const author = await prisma.user.create({
    data: {
      email: `${uniq('author').toLowerCase()}@synthetic.invalid`,
      passwordHash: 'synthetic-not-a-real-hash',
      fullName: `${SYNTHETIC_PREFIX} Author`,
      role: 'CONTRIBUTOR',
      organizationId: org.id,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: `${uniq('reviewer').toLowerCase()}@synthetic.invalid`,
      passwordHash: 'synthetic-not-a-real-hash',
      fullName: `${SYNTHETIC_PREFIX} Reviewer`,
      role: 'VERIFIER',
      organizationId: org.id,
    },
  });

  return {
    domainId: domain.id,
    industryId: industry.id,
    organizationId: org.id,
    authorId: author.id,
    reviewerId: reviewer.id,
  };
}

export async function createKnowledge(
  prisma: PrismaClient,
  base: BaseFixtures,
  overrides: Partial<{ title: string; verifiedAt: Date | null; createdAt: Date }> = {}
): Promise<string> {
  const entry = await prisma.knowledgeEntry.create({
    data: {
      title: overrides.title ?? uniq('Knowledge'),
      problemSummary: `${SYNTHETIC_PREFIX} problem summary`,
      detailedProblem: `${SYNTHETIC_PREFIX} detailed problem`,
      solutionSummary: `${SYNTHETIC_PREFIX} solution summary`,
      technicalExplanation: `${SYNTHETIC_PREFIX} technical explanation`,
      verificationStatus: 'VERIFIED',
      domainId: base.domainId,
      industryId: base.industryId,
      organizationId: base.organizationId,
      creatorId: base.authorId,
      verifiedAt: overrides.verifiedAt === undefined ? new Date('2018-01-01') : overrides.verifiedAt,
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    },
  });
  return entry.id;
}

export async function declareDependency(
  prisma: PrismaClient,
  args: {
    knowledgeId: string;
    kind: string;
    targetIdentifier: string;
    criticality?: string;
    pinnedRevision?: string | null;
    targetId?: string | null;
  }
): Promise<string> {
  const dep = await prisma.knowledgeDependency.create({
    data: {
      knowledgeId: args.knowledgeId,
      kind: args.kind as never,
      targetIdentifier: args.targetIdentifier,
      criticality: (args.criticality ?? 'MAJOR') as never,
      pinnedRevision: args.pinnedRevision ?? null,
      targetId: args.targetId ?? null,
    },
  });
  return dep.id;
}

export async function recordChangeEvent(
  prisma: PrismaClient,
  args: {
    type: string;
    dependencyKind: string;
    subjectIdentifier: string;
    fromRevision?: string | null;
    toRevision?: string | null;
    summary?: string;
  }
): Promise<string> {
  const event = await prisma.changeEvent.create({
    data: {
      type: args.type as never,
      dependencyKind: args.dependencyKind as never,
      subjectIdentifier: args.subjectIdentifier,
      fromRevision: args.fromRevision ?? null,
      toRevision: args.toRevision ?? null,
      summary: args.summary ?? `${SYNTHETIC_PREFIX} change event`,
    },
  });
  return event.id;
}
