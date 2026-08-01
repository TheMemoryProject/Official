'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck2, PlusCircle, ArrowRight, Save, Upload, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { calculateEvidenceStrength } from '@/lib/evidence/strength-engine';

export default function NewEvidencePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('TEST_REPORT');
  const [source, setSource] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [standardsRef, setStandardsRef] = useState('');
  const [isIndependentAudit, setIsIndependentAudit] = useState(false);
  const [isProductionValidated, setIsProductionValidated] = useState(true);
  const [hasStandardsReference, setHasStandardsReference] = useState(true);
  const [hasPeerReviewedPaper, setHasPeerReviewedPaper] = useState(false);
  const [loading, setLoading] = useState(false);

  const { score, rating } = calculateEvidenceStrength({
    isIndependentAudit,
    isProductionValidated,
    hasStandardsReference,
    hasPeerReviewedPaper,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !source) {
      toast({ title: 'Validation Error', description: 'Please fill in all mandatory evidence fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          description: description || summary,
          evidenceType,
          source,
          documentNumber,
          standardsRef,
          isIndependentAudit,
          isProductionValidated,
          hasStandardsReference,
          hasPeerReviewedPaper,
          domainId: 'a0000000-0000-0000-0000-000000000001',
          industryId: 'b0000000-0000-0000-0000-000000000001',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit evidence record');

      toast({ title: 'Evidence Record Created', description: `Evidence strength score: ${score}/100`, type: 'success' });
      router.push('/evidence');
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
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-500">Submit Empirical Evidence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Link physical test reports, FEA stress simulations, and ISO standards to engineering knowledge
          </p>
        </div>
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm">
          STRENGTH SCORE: {score}/100 ({rating})
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Record & Strength Audit</CardTitle>
            <CardDescription>Specify original source metadata and audit verification parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Evidence Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Qualification Test Report #402 - Thermoacoustic Cavity Stress"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Executive Summary *</Label>
              <Input
                id="summary"
                placeholder="Summary of empirical test parameters, sensor calibration, and physical results..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Original Source / Test Facility *</Label>
                <Input
                  id="source"
                  placeholder="e.g. High-Pressure Thermoacoustics Testing Facility Lab 4"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standardsRef">Standards Reference (ISO / ASME / ASTM)</Label>
                <Input
                  id="standardsRef"
                  placeholder="e.g. ASME BPVC Section VIII Division 2"
                  value={standardsRef}
                  onChange={(e) => setStandardsRef(e.target.value)}
                />
              </div>
            </div>

            {/* Checkboxes for Evidence Strength Calculator */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Strength Factors Audit</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProductionValidated}
                    onChange={(e) => setIsProductionValidated(e.target.checked)}
                    className="rounded border-input text-emerald-500"
                  />
                  <span>Physical Test Validated (+15 pts)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndependentAudit}
                    onChange={(e) => setIsIndependentAudit(e.target.checked)}
                    className="rounded border-input text-emerald-500"
                  />
                  <span>Third-Party Lab Audit (+15 pts)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStandardsReference}
                    onChange={(e) => setHasStandardsReference(e.target.checked)}
                    className="rounded border-input text-emerald-500"
                  />
                  <span>ISO/ASME Standard Compliance (+10 pts)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPeerReviewedPaper}
                    onChange={(e) => setHasPeerReviewedPaper(e.target.checked)}
                    className="rounded border-input text-emerald-500"
                  />
                  <span>Peer Reviewed Paper / Patent (+10 pts)</span>
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Submitting Evidence Record...' : 'Publish Evidence Record'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
