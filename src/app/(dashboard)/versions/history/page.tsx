import React from 'react';
import { GitBranch, History, FileDiff, ShieldCheck, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function VersionHistoryPage() {
  const versions = await prisma.knowledgeVersion.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      knowledgeEntry: { select: { title: true, verificationStatus: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Immutable Historical Versioning System</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Version Control & Timeline Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect immutable snapshots, field-level diffs, revision supersessions, and verification history
        </p>
      </div>

      {/* Version Snapshots List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-500" />
            <span>Recorded Knowledge Snapshots ({versions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length > 0 ? (
            versions.map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                      v{v.version}.0
                    </Badge>
                    <span className="font-bold text-sm">{v.title}</span>
                  </div>
                  <Badge variant="verified" className="text-[10px]">{v.knowledgeEntry.verificationStatus}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{v.changeSummary || 'Minor technical revision update.'}</p>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1">
                  <span>Knowledge: {v.knowledgeEntry.title}</span>
                  <span>Recorded: {new Date(v.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No historical version snapshots recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
