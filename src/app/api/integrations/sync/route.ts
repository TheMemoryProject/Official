import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { SyncJobStatus } from '@prisma/client';

const triggerSyncSchema = z.object({
  connectorId: z.string().uuid(),
  jobType: z.enum(['FULL', 'INCREMENTAL', 'MANUAL']).default('INCREMENTAL'),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { connectorId, jobType } = triggerSyncSchema.parse(body);

    const connector = await prisma.integrationConnector.findUnique({ where: { id: connectorId } });
    if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 });

    // Create SyncJob record
    const syncJob = await prisma.syncJob.create({
      data: {
        connectorId,
        jobType,
        status: SyncJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    // Simulate Sync Execution & Lineage Tracking
    const processedCount = Math.floor(Math.random() * 25) + 10;
    
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: SyncJobStatus.COMPLETED,
        recordsProcessed: processedCount,
        recordsSuccess: processedCount,
        completedAt: new Date(),
      },
    });

    await prisma.integrationConnector.update({
      where: { id: connectorId },
      data: { lastSync: new Date() },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        actionType: 'SYNC_EXECUTED',
        targetType: 'CONNECTOR',
        targetId: connectorId,
        summary: `Executed ${jobType} synchronization for ${connector.name} (${processedCount} records synced)`,
      },
    });

    return NextResponse.json({ success: true, syncJob, recordsSynced: processedCount });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error triggering sync job:', error);
    return NextResponse.json({ error: 'Failed to execute synchronization job' }, { status: 500 });
  }
}
