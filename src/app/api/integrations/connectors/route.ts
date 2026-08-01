import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { ConnectorType, ConnectorStatus, ConnectorHealth } from '@prisma/client';

const createConnectorSchema = z.object({
  name: z.string().min(3),
  connectorType: z.nativeEnum(ConnectorType),
  baseUrl: z.string().url().optional(),
  authMethod: z.string().optional(),
  syncDirection: z.string().optional(),
  configJson: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const whereClause: any = { archivedAt: null };
    if (type) whereClause.connectorType = type as ConnectorType;
    if (status) whereClause.status = status as ConnectorStatus;

    const connectors = await prisma.integrationConnector.findMany({
      where: whereClause,
      include: {
        owner: { select: { fullName: true } },
        organization: { select: { name: true } },
        fieldMappings: true,
        webhooks: true,
        syncJobs: { take: 5, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ connectors });
  } catch (error) {
    console.error('Error fetching connectors:', error);
    return NextResponse.json({ error: 'Failed to fetch connectors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createConnectorSchema.parse(body);

    const connector = await prisma.integrationConnector.create({
      data: {
        ...data,
        ownerId: session.id,
        organizationId: session.organizationId,
        status: ConnectorStatus.ACTIVE,
        healthStatus: ConnectorHealth.HEALTHY,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        actionType: 'CONNECTOR_CREATED',
        targetType: 'CONNECTOR',
        targetId: connector.id,
        summary: `Configured Enterprise Connector: ${connector.name} (${connector.connectorType})`,
      },
    });

    return NextResponse.json({ success: true, connector });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating connector:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
