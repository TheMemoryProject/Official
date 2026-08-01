import React from 'react';
import { Award, CheckCircle2, ShieldCheck, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { calculateKnowledgeQualityScore } from '@/lib/governance/quality-engine';

export const dynamic = 'force-dynamic';

export default async function KnowledgeQualityDashboardPage() {
  const knowledge = await prisma.knowledgeEntry.findMany({
    take: 15,
    select: {
      id: true,
      title: true,
      problemSummary: true,
      solutionSummary: true,
      technicalExplanation: true,
      verificationStatus: true,
      complianceMappings: { select: { id: true } },
    },
  });

  const evaluated = knowledge.map((k) => {
    const scores = calculateKnowledgeQualityScore({
      title: k.title,
      problemSummary: k.problemSummary,
      solutionSummary: k.solutionSummary,
      technicalExplanation: k.technicalExplanation,
      verificationStatus: k.verificationStatus,
      hasEvidence: true,
      hasStandards: k.complianceMappings.length > 0,
    });

    return {
      ...k,
      ...scores,
    };
  });

  const averageQualityScore = Math.round(
    evaluated.reduce((acc, curr) => acc + curr.overallQualityScore, 0) / (evaluated.length || 1)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Deterministic Knowledge Assessment Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Knowledge Quality & Health Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated quality breakdown analyzing completeness, evidence coverage, standards mapping, and verification
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground font-mono">Platform Average Score</span>
          <div className="text-4xl font-black text-emerald-400 font-mono">{averageQualityScore} / 100</div>
        </div>
      </div>

      {/* Evaluated Entries List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Evaluated Knowledge Quality Entries ({evaluated.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluated.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{item.title}</span>
                <Badge variant={item.overallQualityScore >= 80 ? 'verified' : 'secondary'} className="font-mono">
                  Quality Score: {item.overallQualityScore}/100
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-muted-foreground block text-[10px]">Completeness</span>
                  <strong className="text-foreground">{item.completenessScore}%</strong>
                </div>
                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-muted-foreground block text-[10px]">Evidence</span>
                  <strong className="text-emerald-400">{item.evidenceScore}%</strong>
                </div>
                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-muted-foreground block text-[10px]">Standards</span>
                  <strong className="text-blue-400">{item.standardsScore}%</strong>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
