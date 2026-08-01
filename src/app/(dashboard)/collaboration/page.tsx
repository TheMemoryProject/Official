import React from 'react';
import { Users, CheckSquare, GitCommit, ShieldCheck, Activity, ArrowRight, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CollaborationDashboardPage() {
  const [decisionCount, taskCount, activityCount] = await Promise.all([
    prisma.engineeringDecision.count(),
    prisma.engineeringTask.count(),
    prisma.activityLog.count(),
  ]);

  const recentTasks = await prisma.engineeringTask.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { assignee: { select: { fullName: true } } },
  });

  const recentDecisions = await prisma.engineeringDecision.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { fullName: true } } },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Collaboration Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized hub for engineering decisions, team assignments, expert reviews, and activity monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/decisions/new">
            <Button variant="brand" size="sm">
              <GitCommit className="w-4 h-4 mr-2" /> New Decision
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <CheckSquare className="w-4 h-4 mr-2" /> Task Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Documented Decisions</span>
          <span className="text-3xl font-extrabold text-blue-500 mt-2 block">{decisionCount}</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Active Tasks</span>
          <span className="text-3xl font-extrabold text-purple-500 mt-2 block">{taskCount}</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Logged Activities</span>
          <span className="text-3xl font-extrabold text-emerald-500 mt-2 block">{activityCount}</span>
        </Card>
      </div>

      {/* Workspace Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Decisions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-blue-500" />
              <span>Recent Engineering Decisions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDecisions.map((d) => (
              <div key={d.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{d.title}</h4>
                  <span className="text-xs text-muted-foreground">Owner: {d.owner.fullName}</span>
                </div>
                <Badge variant="verified">{d.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              <span>Recent Verification Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{t.title}</h4>
                  <span className="text-xs text-muted-foreground">Assigned to: {t.assignee?.fullName || 'Unassigned'}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
