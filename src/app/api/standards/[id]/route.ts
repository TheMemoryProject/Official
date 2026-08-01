import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const standard = await prisma.standardRecord.findUnique({
      where: { id },
      include: {
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        contributor: { select: { fullName: true } },
        reviewer: { select: { fullName: true } },
        hierarchyNodes: { orderBy: { orderIndex: 'asc' } },
        revisions: { orderBy: { releaseDate: 'desc' } },
        complianceMappings: {
          include: {
            knowledgeEntry: { select: { title: true } },
            failureRecord: { select: { title: true } },
            evidenceRecord: { select: { title: true } },
            hierarchyNode: { select: { identifier: true, title: true } },
          },
        },
      },
    });

    if (!standard) {
      return NextResponse.json({ error: 'Standard record not found' }, { status: 404 });
    }

    return NextResponse.json({ standard });
  } catch (error) {
    console.error('Error fetching standard detail:', error);
    return NextResponse.json({ error: 'Failed to fetch standard detail' }, { status: 500 });
  }
}
