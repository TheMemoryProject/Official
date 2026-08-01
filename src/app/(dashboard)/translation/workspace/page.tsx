'use client';

import React, { useState } from 'react';
import { Share2, Zap, ArrowRight, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function TranslationWorkspacePage() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [translationResult, setTranslationResult] = useState<any>(null);

  const handleRunTranslation = async () => {
    setAnalyzing(true);
    try {
      // Execute cross domain translation API
      const res = await fetch('/api/translation');
      const data = await res.json();
      setTranslationResult(data.translations?.[0] || null);
      toast({ title: 'Translation Complete', description: 'Cross-domain principles mapped successfully', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Translation Error', description: err.message, type: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Cross-Domain Concept Translation Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Translation Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map verified solutions from shipbuilding, defense, or semiconductors into aerospace & automotive
          </p>
        </div>
        <Button variant="brand" onClick={handleRunTranslation} disabled={analyzing}>
          {analyzing ? 'Analyzing Concept Equivalence...' : 'Run Translation Analysis'}
        </Button>
      </div>

      {/* Workspace Display */}
      {translationResult ? (
        <div className="space-y-6">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="verified">
                  {translationResult.translationConfidence}% TRANSLATION CONFIDENCE
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {translationResult.sourceKnowledge?.industry?.name} ➔ {translationResult.targetKnowledge?.industry?.name}
                </span>
              </div>
              <CardTitle className="text-xl mt-2">{translationResult.explanation}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <span className="text-xs font-bold text-blue-400">Source Industry Solution</span>
                  <h4 className="font-bold text-sm">{translationResult.sourceKnowledge?.title}</h4>
                  <p className="text-xs text-muted-foreground">Domain: {translationResult.sourceKnowledge?.domain?.name}</p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <span className="text-xs font-bold text-emerald-400">Target Industry Application</span>
                  <h4 className="font-bold text-sm">{translationResult.targetKnowledge?.title}</h4>
                  <p className="text-xs text-muted-foreground">Domain: {translationResult.targetKnowledge?.domain?.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="text-xs font-bold text-purple-400">Shared Engineering Principles:</span>
                <p className="text-xs text-foreground/90">{translationResult.functionalSimilarities}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center text-sm text-muted-foreground space-y-2">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
          <p className="font-semibold">No active translation analysis selected.</p>
          <p className="text-xs">Click "Run Translation Analysis" to discover cross-industry principle equivalences.</p>
        </Card>
      )}
    </div>
  );
}
