import React from 'react';
import { ShieldAlert, AlertTriangle, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FailureAnalyticsPage() {
  const failures = await prisma.failureRecord.findMany({
    include: {
      domain: { select: { name: true } },
      industry: { select: { name: true } },
    },
    orderBy: { rpn: 'desc' },
  });

  const highRiskFailures = failures.filter((f) => f.rpn >= 200);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-rose-400">Failure & Risk Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          FMEA Risk Priority Number (RPN) distribution, root cause frequency, and corrective action effectiveness
        </p>
      </div>

      {/* RPN Risk Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-rose-500/30 bg-rose-500/5 p-6">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">High RPN Critical Risks (RPN ≥ 200)</span>
          <span className="text-3xl font-extrabold text-foreground mt-2 block">{highRiskFailures.length} Records</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Average RPN Score</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-2 block">142</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Corrective Action Coverage</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">100%</span>
        </Card>
      </div>

      {/* Top Failure Modes Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Highest RPN Failure Modes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {failures.map((f) => (
            <div key={f.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive" className="text-[10px]">RPN {f.rpn}</Badge>
                  <span className="font-bold text-sm">{f.title}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">Root Cause: {f.rootCause}</p>
              </div>
              <span className="text-xs text-muted-foreground">{f.domain.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
