import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { calculateEvidenceStrength } from '@/lib/evidence/strength-engine';
import { z } from 'zod';
import { EvidenceType } from '@prisma/client';

const createEvidenceSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  description: z.string().min(10),
  evidenceType: z.nativeEnum(EvidenceType),
  source: z.string(),
  documentNumber: z.string().optional(),
  standardsRef: z.string().optional(),
  fileUrl: z.string().optional(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
  isIndependentAudit: z.boolean().optional(),
  isProductionValidated: z.boolean().optional(),
  hasStandardsReference: z.boolean().optional(),
  hasPeerReviewedPaper: z.boolean().optional(),
});

export async function GET() {
  try {
    const evidenceRecords = await prisma.evidenceRecord.findMany({
      where: { deletedAt: null },
      include: {
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        contributor: { select: { fullName: true } },
      },
      orderBy: { evidenceStrengthScore: 'desc' },
      take: 50,
    });

    return NextResponse.json({ evidenceRecords });
  } catch (error) {
    console.error('Error fetching evidence records:', error);
    return NextResponse.json({ error: 'Failed to fetch evidence records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createEvidenceSchema.parse(body);

    const { score } = calculateEvidenceStrength({
      isIndependentAudit: data.isIndependentAudit,
      isProductionValidated: data.isProductionValidated,
      hasStandardsReference: data.hasStandardsReference,
      hasPeerReviewedPaper: data.hasPeerReviewedPaper,
    });

    const record = await prisma.evidenceRecord.create({
      data: {
        title: data.title,
        summary: data.summary,
        description: data.description,
        evidenceType: data.evidenceType,
        source: data.source,
        documentNumber: data.documentNumber,
        standardsRef: data.standardsRef,
        fileUrl: data.fileUrl,
        domainId: data.domainId,
        industryId: data.industryId,
        evidenceStrengthScore: score,
        contributorId: session.id,
        organizationId: session.organizationId,
        verificationStatus: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'VERIFIED' : 'SUBMITTED',
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating evidence record:', error);
    return NextResponse.json({ error: 'Failed to create evidence record' }, { status: 500 });
  }
}
