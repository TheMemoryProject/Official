import React from 'react';
import { Clock, CheckCircle2, ShieldCheck, FileText, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function IngestionQueuePage() {
  const jobs = await prisma.ingestionJob.findMany({
    include: {
      document: { select: { title: true, originalFilename: true } },
    },
    orderBy: { startedAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Asynchronous Background Processing Queue</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ingestion Queue & Pipeline Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of OCR scanning, text parsing, entity extraction, and verification queue assignment
          </p>
        </div>
      </div>

      {/* Queue List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Active Pipeline Jobs ({jobs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                      STAGE: {job.stage}
                    </Badge>
                    <span className="font-bold text-sm">{job.document.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">
                    File: {job.document.originalFilename} • Processed: {job.recordsProcessed} Extracted Facts
                  </span>
                </div>
                <Badge variant={job.status === 'SUCCESS' ? 'verified' : 'secondary'} className="font-mono">
                  {job.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Background queue processing smoothly. Zero failed extraction jobs.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
