import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateSystemHealthScore } from '@/lib/operations/observability-engine';

export async function GET() {
  try {
    const records = await prisma.systemHealthRecord.findMany({
      orderBy: { serviceName: 'asc' },
    });

    const summary = calculateSystemHealthScore(records);

    return NextResponse.json({ summary, services: records });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
  }
}
