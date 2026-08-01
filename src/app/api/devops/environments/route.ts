import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const environments = await prisma.deploymentEnvironmentConfig.findMany({
      orderBy: { envName: 'asc' },
    });

    return NextResponse.json({ environments });
  } catch (error) {
    console.error('Error fetching environment configs:', error);
    return NextResponse.json({ error: 'Failed to fetch environment configs' }, { status: 500 });
  }
}
