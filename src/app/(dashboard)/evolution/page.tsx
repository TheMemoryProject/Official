import React from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Clock, GitBranch, ShieldCheck, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CRITICALITY_STYLE: Record<string, string> = {
  BLOCKING: 'bg-red-500/10 text-red-400 border-red-500/20',
  MAJOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MINOR: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_STYLE: Record<string, string> = {
  CURRENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REVALIDATION_REQUIRED: 'bg-red-500/10 text-red-400 border-red-500/20',
  UNDER_REVALIDATION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SUPERSEDED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RETIRED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

function daysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default async function KnowledgeEvolutionPage() {
  const [openTasks, recentEvents, currencyRows, statusCounts] = await Promise.all([
    prisma.revalidationTask.findMany({
      where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_REVIEW'] } },
      include: {
        knowledge: { select: { id: true, title: true, verifiedAt: true } },
        changeEvent: {
          select: { type: true, subjectIdentifier: true, fromRevision: true, toRevision: true },
        },
      },
      orderBy: [{ criticality: 'asc' }, { openedAt: 'asc' }],
      take: 25,
    }),
    prisma.changeEvent.findMany({
      include: { _count: { select: { impacts: true, tasks: true } } },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    }),
    prisma.knowledgeCurrency.findMany({
      include: { knowledge: { select: { id: true, title: true } } },
      orderBy: { currencyScore: 'asc' },
      take: 10,
    }),
    prisma.knowledgeCurrency.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const totalTracked = statusCounts.reduce((acc, s) => acc + s._count._all, 0);
  const needingReview =
    statusCounts.find((s) => s.status === 'REVALIDATION_REQUIRED')?._count._all ?? 0;
  const blocking = openTasks.filter((t) => t.criticality === 'BLOCKING').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
          <Activity className="w-3.5 h-3.5" />
          <span>Knowledge Evolution &amp; Continuous Revalidation</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Knowledge Evolution</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engineering knowledge does not stay true on its own. When a standard is revised, a
          material spec changes, or evidence is retracted, every dependent conclusion is traced
          and flagged for re-verification.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground font-semibold">TRACKED</div>
            <div className="text-3xl font-extrabold mt-1">{totalTracked}</div>
            <div className="text-xs text-muted-foreground mt-1">knowledge objects with currency</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground font-semibold">NEEDS REVIEW</div>
            <div className="text-3xl font-extrabold mt-1 text-red-400">{needingReview}</div>
            <div className="text-xs text-muted-foreground mt-1">flagged by a change event</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground font-semibold">BLOCKING</div>
            <div className="text-3xl font-extrabold mt-1 text-red-400">{blocking}</div>
            <div className="text-xs text-muted-foreground mt-1">conclusions that cannot stand</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground font-semibold">CHANGE EVENTS</div>
            <div className="text-3xl font-extrabold mt-1">{recentEvents.length}</div>
            <div className="text-xs text-muted-foreground mt-1">recorded most recently</div>
          </CardContent>
        </Card>
      </div>

      {/* Revalidation queue */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Revalidation Queue</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {openTasks.length > 0 ? (
            openTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/knowledge/${task.knowledge.id}`}
                    className="font-bold text-sm hover:text-blue-400 transition-colors"
                  >
                    {task.knowledge.title}
                  </Link>
                  <Badge className={`shrink-0 border ${CRITICALITY_STYLE[task.criticality]}`}>
                    {task.criticality}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{task.reason}</p>
                {task.changeEvent && (
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <GitBranch className="w-3 h-3" />
                    <span>
                      {task.changeEvent.type} · {task.changeEvent.subjectIdentifier}
                      {task.changeEvent.fromRevision && task.changeEvent.toRevision
                        ? ` (${task.changeEvent.fromRevision} → ${task.changeEvent.toRevision})`
                        : ''}
                    </span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Opened {daysAgo(task.openedAt)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">No knowledge is currently flagged</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nothing has been invalidated by a recorded change. This is the desired state, not
                an empty one — it means every tracked dependency is still holding.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lowest currency */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Lowest Currency</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currencyRows.length > 0 ? (
              currencyRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/knowledge/${row.knowledge.id}`}
                    className="text-sm truncate hover:text-blue-400 transition-colors"
                  >
                    {row.knowledge.title}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`border ${STATUS_STYLE[row.status] ?? ''}`}>
                      {row.status}
                    </Badge>
                    <span className="text-sm font-mono font-bold w-8 text-right">
                      {row.currencyScore}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No currency has been computed yet. Currency is derived when a knowledge object
                declares dependencies or is touched by a change event.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Change feed */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              <span>Recent Change Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono truncate">{event.subjectIdentifier}</span>
                    <Badge className="shrink-0 border border-border">{event.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.summary}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {event._count.impacts} impacted · {event._count.tasks} tasks ·{' '}
                    {daysAgo(event.detectedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No change events recorded yet. Record one via{' '}
                <code className="font-mono">POST /api/evolution/change-events</code>.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
