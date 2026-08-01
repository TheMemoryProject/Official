import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compareKnowledgeVersions } from '@/lib/versioning/diff-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeId = searchParams.get('knowledgeId');

    if (!knowledgeId) {
      return NextResponse.json({ error: 'knowledgeId required' }, { status: 400 });
    }

    const versions = await prisma.knowledgeVersion.findMany({
      where: { knowledgeEntryId: knowledgeId },
      orderBy: { version: 'asc' },
    });

    if (versions.length < 2) {
      return NextResponse.json({
        comparison: null,
        message: 'At least 2 versions are required to compute side-by-side diff.',
      });
    }

    const v1 = JSON.parse(versions[0].snapshotJson);
    const v2 = JSON.parse(versions[versions.length - 1].snapshotJson);

    const comparison = compareKnowledgeVersions(v1, v2);

    return NextResponse.json({ comparison, versionCount: versions.length });
  } catch (error) {
    console.error('Error calculating version diff:', error);
    return NextResponse.json({ error: 'Failed to calculate diff' }, { status: 500 });
  }
}
