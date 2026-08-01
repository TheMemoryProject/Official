import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const flagSchema = z.object({
  key: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(5),
  isEnabled: z.boolean().default(true),
  rolloutPercentage: z.number().min(0).max(100).default(100),
});

export async function GET() {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = flagSchema.parse(body);

    const flag = await prisma.featureFlag.upsert({
      where: { key: data.key },
      update: {
        isEnabled: data.isEnabled,
        rolloutPercentage: data.rolloutPercentage,
      },
      create: {
        key: data.key,
        name: data.name,
        description: data.description,
        isEnabled: data.isEnabled,
        rolloutPercentage: data.rolloutPercentage,
      },
    });

    return NextResponse.json({ success: true, flag });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error managing feature flag:', error);
    return NextResponse.json({ error: 'Failed to manage feature flag' }, { status: 500 });
  }
}
