import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createStandardSchema = z.object({
  title: z.string().min(5),
  standardNumber: z.string().min(2),
  standardFamily: z.string(),
  revision: z.string(),
  officialPublisher: z.string(),
  description: z.string().min(10),
  scope: z.string().optional(),
  keywords: z.string().optional(),
  externalSourceUrl: z.string().optional(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const family = searchParams.get('family');
    const query = searchParams.get('q');

    const whereClause: any = {};
    if (family) whereClause.standardFamily = family;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { standardNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { officialPublisher: { contains: query, mode: 'insensitive' } },
      ];
    }

    const standards = await prisma.standardRecord.findMany({
      where: whereClause,
      include: {
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        contributor: { select: { fullName: true } },
        reviewer: { select: { fullName: true } },
        hierarchyNodes: true,
        revisions: true,
        complianceMappings: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ standards });
  } catch (error) {
    console.error('Error fetching standards:', error);
    return NextResponse.json({ error: 'Failed to fetch standards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createStandardSchema.parse(body);

    const standard = await prisma.standardRecord.create({
      data: {
        ...data,
        contributorId: session.id,
        organizationId: session.organizationId,
        verificationStatus: session.role === 'ADMIN' || session.role === 'VERIFIER' ? 'VERIFIED' : 'SUBMITTED',
      },
    });

    // Create initial revision entry
    await prisma.standardRevision.create({
      data: {
        standardId: standard.id,
        revision: data.revision,
        changeSummary: 'Initial Standard Family Registration',
      },
    });

    return NextResponse.json({ success: true, standard });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating standard record:', error);
    return NextResponse.json({ error: 'Failed to create standard record' }, { status: 500 });
  }
}
