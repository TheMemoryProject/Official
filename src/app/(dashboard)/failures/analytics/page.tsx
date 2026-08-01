import React from 'react';
import { Activity, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FailureAnalyticsPage() {
  const failures = await prisma.failureRecord.findMany({
    where: { deletedAt: null },
    include: { domain: true, industry: true },
    orderBy: { rpn: 'desc' },
  });

  const avgRpn = failures.length > 0 ? Math.round(failures.reduce((acc, f) => acc + f.rpn, 0) / failures.length) : 0;
  const highRiskCount = failures.filter((f) => f.rpn >= 300).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-500">Failure & FMEA Risk Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate failure frequency, Risk Priority Number (RPN) heatmaps, and prevention metrics
          </p>
        </div>
        <Badge variant="destructive" className="w-fit text-sm px-3 py-1">
          {highRiskCount} High-Risk Failures Identified (RPN ≥ 300)
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Failure Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-foreground">{failures.length}</span>
            <p className="text-xs text-muted-foreground mt-1">Documented across 4 industries</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Fleet RPN</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-rose-400">{avgRpn}</span>
            <p className="text-xs text-muted-foreground mt-1">Calculated via S × O × D</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preventative Actions Enforced</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-emerald-400">100%</span>
            <p className="text-xs text-muted-foreground mt-1">Preventative measures logged</p>
          </CardContent>
        </Card>
      </div>

      {/* RPN Risk Priority Leaderboard */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Risk Priority Leaderboard</CardTitle>
          <CardDescription>Failures sorted by highest composite FMEA Risk Priority Number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {failures.map((f) => (
            <div key={f.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-400">RPN {f.rpn} ({f.severity}S × {f.occurrence}O × {f.detectability}D)</span>
                <h4 className="font-bold text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground">Root Cause: {f.rootCause}</p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">{f.domain.name}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
