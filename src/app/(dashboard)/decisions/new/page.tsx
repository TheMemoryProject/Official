'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitCommit, PlusCircle, ArrowRight, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewDecisionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [decisionSummary, setDecisionSummary] = useState('');
  const [detailedRationale, setDetailedRationale] = useState('');
  const [alternativesConsidered, setAlternativesConsidered] = useState('');
  const [chosenOption, setChosenOption] = useState('');
  const [tradeoffs, setTradeoffs] = useState('');
  const [risks, setRisks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !decisionSummary || !detailedRationale || !chosenOption) {
      toast({ title: 'Validation Error', description: 'Please fill in all mandatory decision fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          decisionSummary,
          detailedRationale,
          alternativesConsidered: alternativesConsidered || 'N/A',
          chosenOption,
          tradeoffs: tradeoffs || 'N/A',
          risks: risks || 'N/A',
          domainId: 'a0000000-0000-0000-0000-000000000001',
          industryId: 'b0000000-0000-0000-0000-000000000001',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create decision record');

      toast({ title: 'Engineering Decision Registered', description: 'Published to decision workspace', type: 'success' });
      router.push('/decisions');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Submission Error', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-500">Draft Engineering Decision</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Document architectural trade-offs, alternatives considered, and rationale for technical review
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Decision Metadata & Rationale</CardTitle>
            <CardDescription>Specify technical parameters and evaluated alternatives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Decision Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Selection of Inconel 718 Additive Manufacturing for Resonator Faceplate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decisionSummary">Executive Summary *</Label>
              <Input
                id="decisionSummary"
                placeholder="Brief summary of technical decision and engineering impact..."
                value={decisionSummary}
                onChange={(e) => setDecisionSummary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chosenOption">Chosen Engineering Strategy *</Label>
              <Input
                id="chosenOption"
                placeholder="e.g. Additive Laser Powder Bed Fusion with Inconel 718 Superalloy"
                value={chosenOption}
                onChange={(e) => setChosenOption(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailedRationale">Detailed Technical Rationale *</Label>
              <textarea
                id="detailedRationale"
                rows={5}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                placeholder="Detailed rationale explaining why this option was chosen over alternatives..."
                value={detailedRationale}
                onChange={(e) => setDetailedRationale(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativesConsidered">Alternatives Considered & Rejection Rationale</Label>
              <textarea
                id="alternativesConsidered"
                rows={3}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                placeholder="e.g. Option A: 5-axis CNC Milling (Rejected due to tool access limits)..."
                value={alternativesConsidered}
                onChange={(e) => setAlternativesConsidered(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tradeoffs">Accepted Tradeoffs</Label>
                <Input
                  id="tradeoffs"
                  placeholder="e.g. Higher surface roughness requiring chemical polishing"
                  value={tradeoffs}
                  onChange={(e) => setTradeoffs(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risks">Identified Risks & Mitigations</Label>
                <Input
                  id="risks"
                  placeholder="e.g. Porosity voids under high-cycle fatigue"
                  value={risks}
                  onChange={(e) => setRisks(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Publishing Decision...' : 'Publish Engineering Decision'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
