import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const triggerDeploymentSchema = z.object({
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEV', 'AIR_GAPPED']).default('PRODUCTION'),
  deploymentMode: z.string().default('MULTI_TENANT_SAAS'),
  version: z.string().default('v1.0.0'),
});

export async function GET() {
  try {
    const deployments = await prisma.systemDeploymentRecord.findMany({
      orderBy: { deployedAt: 'desc' },
    });

    return NextResponse.json({ deployments });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = triggerDeploymentSchema.parse(body);

    const deployment = await prisma.systemDeploymentRecord.create({
      data: {
        environment: data.environment,
        deploymentMode: data.deploymentMode,
        version: data.version,
        status: 'SUCCESS',
        deployedBy: session.email,
      },
    });

    return NextResponse.json({ success: true, deployment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error triggering deployment:', error);
    return NextResponse.json({ error: 'Failed to trigger deployment' }, { status: 500 });
  }
}
