'use client';

import React, { useState } from 'react';
import { Target, Layers, ShieldCheck, Zap, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function ProblemMatcherPage() {
  const { toast } = useToast();
  const [primaryFunction, setPrimaryFunction] = useState('');
  const [failureMode, setFailureMode] = useState('');
  const [phenomenon, setPhenomenon] = useState('');
  const [materialFamily, setMaterialFamily] = useState('');
  const [process, setProcess] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFunction && !failureMode) {
      toast({ title: 'Input Required', description: 'Enter at least a primary function or failure mode', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/matcher/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryFunction, failureMode, phenomenon, materialFamily, process }),
      });

      const data = await res.json();
      setMatches(data.matches || []);
      toast({ title: 'Cross-Domain Analysis Complete', description: `Identified ${data.matches?.length || 0} candidate matches`, type: 'success' });
    } catch (err: any) {
      toast({ title: 'Analysis Error', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Deterministic Matcher • No AI Hallucinations</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cross-Domain Problem Matcher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Input your engineering problem parameters to match verified solutions from other industries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel */}
        <Card className="border-border bg-card/60 backdrop-blur-xl">
          <form onSubmit={handleAnalyze}>
            <CardHeader>
              <CardTitle className="text-lg">Problem Parameters</CardTitle>
              <CardDescription>Decompose your obstacle into structured boundary conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Engineering Function *</Label>
                <Input
                  placeholder="e.g. Passive acoustic resonator damping"
                  value={primaryFunction}
                  onChange={(e) => setPrimaryFunction(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Observed Failure Mode</Label>
                <Input
                  placeholder="e.g. Acoustic fatigue cracking"
                  value={failureMode}
                  onChange={(e) => setFailureMode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Physical Phenomenon</Label>
                <Input
                  placeholder="e.g. Thermoacoustic oscillation"
                  value={phenomenon}
                  onChange={(e) => setPhenomenon(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Material Family</Label>
                <Input
                  placeholder="e.g. Nickel Superalloy / Inconel 718"
                  value={materialFamily}
                  onChange={(e) => setMaterialFamily(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Manufacturing Process</Label>
                <Input
                  placeholder="e.g. Laser Powder Bed Fusion"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                />
              </div>

              <Button type="submit" variant="brand" className="w-full mt-2" disabled={loading}>
                {loading ? 'Executing Deterministic Analysis...' : 'Run Matching Engine'}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Right Match Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center space-x-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <span>Ranked Cross-Domain Discoveries</span>
            </h2>
            <Badge variant="outline">{matches.length} Matches Found</Badge>
          </div>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((m, idx) => (
                <div key={idx} className="p-6 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="verified" className="text-xs px-2 py-0.5">
                          {m.overallScore}% OVERALL SIMILARITY
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {m.domainName} • {m.industryName}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">{m.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{m.solutionSummary}</p>

                  {/* Match Explanations */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="text-xs font-bold text-emerald-400">Match Explanation:</span>
                    <ul className="text-xs text-emerald-300 space-y-0.5 list-disc pl-4">
                      {m.explanations.map((exp: string, i: number) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-sm text-muted-foreground space-y-2">
              <Activity className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
              <p className="font-semibold">No active problem analysis run.</p>
              <p className="text-xs">Fill in your engineering parameters and run the matching engine to discover cross-domain solutions.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
