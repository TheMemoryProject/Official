import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const partnerships = await prisma.orgPartnership.findMany({
      include: {
        requesterOrg: { select: { name: true } },
        partnerOrg: { select: { name: true } },
      },
    });

    return NextResponse.json({ partnerships });
  } catch (error) {
    console.error('Error fetching partnerships:', error);
    return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 });
  }
}
