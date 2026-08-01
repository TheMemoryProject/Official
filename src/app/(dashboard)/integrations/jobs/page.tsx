import React from 'react';
import { RefreshCw, CheckCircle2, Clock, AlertTriangle, Play, Database, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SyncJobsMonitorPage() {
  const syncJobs = await prisma.syncJob.findMany({
    include: {
      connector: { select: { name: true, connectorType: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Synchronization Job Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time execution status of enterprise synchronization jobs and data lineage records
          </p>
        </div>
      </div>

      {/* Sync Jobs Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Active & Historical Sync Jobs ({syncJobs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {syncJobs.length > 0 ? (
            syncJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-border bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={job.status === 'COMPLETED' ? 'verified' : 'secondary'} className="text-[10px]">
                      {job.status}
                    </Badge>
                    <span className="font-bold text-sm">{job.connector.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">Job Type: {job.jobType} • ID: {job.id.substring(0, 8)}</p>
                </div>

                <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                  <span>Processed: <strong className="text-foreground">{job.recordsProcessed}</strong></span>
                  <span>Success: <strong className="text-emerald-400">{job.recordsSuccess}</strong></span>
                  <span>Failed: <strong className="text-rose-400">{job.recordsFailed}</strong></span>
                  <span>Completed: <strong className="text-foreground">{job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : 'In Progress'}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No synchronization jobs recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
