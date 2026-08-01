'use client';

import React, { useState } from 'react';
import { Activity, ShieldAlert, ArrowRight, Zap, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function StandardImpactWorkspacePage() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [impactResult, setImpactResult] = useState<any>(null);

  const handleRunImpactAnalysis = async () => {
    setAnalyzing(true);
    try {
      const stdRes = await fetch('/api/standards');
      const stdData = await stdRes.json();
      const stdId = stdData.standards?.[0]?.id;

      if (!stdId) {
        toast({ title: 'Standard Error', description: 'No standards available for impact analysis', type: 'error' });
        return;
      }

      const res = await fetch('/api/standards/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardId: stdId, newRevision: '2026 Revised Edition' }),
      });

      const data = await res.json();
      setImpactResult(data.impact);
      toast({ title: 'Change Impact Analysis Complete', description: 'Generated impact report requiring human review', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Impact Analysis Error', description: err.message, type: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Standard Change Impact Analysis Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Standard Revision Impact Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluate downstream impacts on knowledge, failures, and test evidence when standard revisions occur
          </p>
        </div>
        <Button variant="brand" onClick={handleRunImpactAnalysis} disabled={analyzing}>
          {analyzing ? 'Analyzing Downstream Impacts...' : 'Trigger Change Impact Analysis'}
        </Button>
      </div>

      {/* Impact Results */}
      {impactResult ? (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-purple-400 border-purple-500/40">
                MANDATORY HUMAN REVIEW REQUIRED
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {impactResult.standardNumber}: {impactResult.oldRevision} ➔ {impactResult.newRevision}
              </span>
            </div>
            <CardTitle className="text-xl mt-2">{impactResult.impactSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block">Affected Knowledge</span>
                <span className="text-2xl font-bold text-foreground">{impactResult.affectedKnowledgeCount} Entries</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block">Affected Failures</span>
                <span className="text-2xl font-bold text-rose-400">{impactResult.affectedFailuresCount} Failures</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted-foreground block">Affected Evidence</span>
                <span className="text-2xl font-bold text-emerald-400">{impactResult.affectedEvidenceCount} Items</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Generated Audit Action Items</span>
              <div className="space-y-2">
                {impactResult.actionItems.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/60 border border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                      <p className="text-xs text-muted-foreground">{item.actionRequired}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">{item.urgency} URGENCY</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center text-sm text-muted-foreground space-y-2">
          <Activity className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
          <p className="font-semibold">No active impact report generated.</p>
          <p className="text-xs">Click "Trigger Change Impact Analysis" to evaluate downstream standard revision impacts.</p>
        </Card>
      )}
    </div>
  );
}
