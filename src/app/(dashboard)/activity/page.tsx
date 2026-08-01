import React from 'react';
import { Activity, Clock, ShieldCheck, FileCheck2, GitCommit, User, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ActivityTimelinePage() {
  const activities = await prisma.activityLog.findMany({
    include: {
      user: { select: { fullName: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-time Audit & Collaboration Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Engineering Activity Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete transparent audit trail of engineering decisions, verification actions, and discussions
        </p>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-border">
        {activities.length > 0 ? (
          activities.map((act) => (
            <div key={act.id} className="relative pl-12">
              <div className="absolute left-3 top-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs ring-4 ring-background">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <Card className="border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">{act.actionType}</Badge>
                    <span className="text-[11px] text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-sm text-foreground">{act.summary}</p>
                  <p className="text-xs text-muted-foreground">Performed by {act.user.fullName} ({act.user.title || 'Engineer'})</p>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No activity log entries recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
