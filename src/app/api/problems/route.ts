import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const problems = await prisma.engineeringProblem.findMany({
      where: { deletedAt: null },
      include: {
        creator: {
          select: { id: true, fullName: true, title: true },
        },
        domain: { select: { name: true, code: true } },
        industry: { select: { name: true, code: true } },
        _count: {
          select: { solutions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ problems });
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
  }
}
