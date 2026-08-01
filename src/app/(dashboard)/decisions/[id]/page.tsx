import React from 'react';
import { notFound } from 'next/navigation';
import { GitCommit, ShieldCheck, CheckCircle2, ArrowRight, Layers, FileCheck2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const decision = await prisma.engineeringDecision.findUnique({
    where: { id },
    include: {
      domain: true,
      industry: true,
      owner: { select: { fullName: true, title: true } },
      knowledgeEntry: { select: { id: true, title: true, solutionSummary: true } },
      failureRecord: { select: { id: true, title: true, rootCause: true } },
      evidenceRecord: { select: { id: true, title: true, evidenceStrengthScore: true } },
      standard: { select: { id: true, standardNumber: true, title: true } },
      tasks: {
        include: {
          assignee: { select: { fullName: true } },
        },
      },
    },
  });

  if (!decision) return notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Badge variant="verified">{decision.status}</Badge>
          <span className="text-xs font-mono text-muted-foreground">{decision.domain.name} • {decision.industry.name}</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">{decision.title}</h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
          <span>Decision Owner: <strong className="text-foreground">{decision.owner.fullName}</strong> ({decision.owner.title || 'Senior Engineer'})</span>
          <span>Version: <strong className="text-foreground">v{decision.version}</strong></span>
          <span>Approved: <strong className="text-emerald-400">{decision.approvalDate ? new Date(decision.approvalDate).toLocaleDateString() : 'Pending Approval'}</strong></span>
        </div>
      </div>

      {/* Rationale & Chosen Option */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold text-emerald-400">Chosen Option & Technical Rationale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-semibold text-emerald-300">
            {decision.chosenOption}
          </div>
          <p>{decision.detailedRationale}</p>
        </CardContent>
      </Card>

      {/* Alternatives & Tradeoffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alternatives Considered</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {decision.alternativesConsidered}
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400">Tradeoffs & Evaluated Risks</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p><strong>Tradeoffs: </strong>{decision.tradeoffs}</p>
            <p><strong>Risks: </strong>{decision.risks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Linked Action Tasks */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Linked Verification Tasks ({decision.tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {decision.tasks.map((t) => (
            <div key={t.id} className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                <h4 className="font-bold text-sm">{t.title}</h4>
              </div>
              <span className="text-xs text-muted-foreground">Assigned to {t.assignee?.fullName || 'Unassigned'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
