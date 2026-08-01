import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const knowledge = await prisma.knowledgeEntry.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      select: { title: true },
      take: 5,
    });

    const failures = await prisma.failureRecord.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      select: { title: true },
      take: 5,
    });

    const suggestions = Array.from(
      new Set([...knowledge.map((k) => k.title), ...failures.map((f) => f.title)])
    ).slice(0, 8);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching search autocomplete:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
