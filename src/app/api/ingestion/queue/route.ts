import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const jobs = await prisma.ingestionJob.findMany({
      include: {
        document: { select: { title: true, originalFilename: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching ingestion queue:', error);
    return NextResponse.json({ error: 'Failed to fetch ingestion queue' }, { status: 500 });
  }
}
