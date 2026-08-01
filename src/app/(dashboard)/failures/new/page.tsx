'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, PlusCircle, ArrowRight, Save, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewFailurePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Structural Fatigue');
  const [failureType, setFailureType] = useState('PHYSICAL_TEST_FAILURE');
  const [subsystem, setSubsystem] = useState('Injector Faceplate');
  const [component, setComponent] = useState('Resonator Cavity Wall');
  const [phenomenon, setPhenomenon] = useState('Thermoacoustic Cavitation');
  const [rootCause, setRootCause] = useState('');
  const [immediateCause, setImmediateCause] = useState('');
  const [severity, setSeverity] = useState(8);
  const [occurrence, setOccurrence] = useState(6);
  const [detectability, setDetectability] = useState(7);
  const [correctiveActions, setCorrectiveActions] = useState('');
  const [preventiveActions, setPreventiveActions] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [loading, setLoading] = useState(false);

  const rpn = severity * occurrence * detectability;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !rootCause || !correctiveActions || !lessonsLearned) {
      toast({ title: 'Validation Error', description: 'Please fill in all mandatory RCA fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/failures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          description: description || summary,
          category,
          failureType,
          subsystem,
          component,
          phenomenon,
          rootCause,
          immediateCause: immediateCause || rootCause,
          severity,
          occurrence,
          detectability,
          correctiveActions,
          preventiveActions: preventiveActions || correctiveActions,
          lessonsLearned,
          domainId: 'a0000000-0000-0000-0000-000000000001',
          industryId: 'b0000000-0000-0000-0000-000000000001',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit failure record');

      toast({ title: 'Failure Record Created', description: `FMEA RPN calculated: ${rpn}`, type: 'success' });
      router.push('/failures');
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
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-500">Document Engineering Failure</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish FMEA risk scores, 5-Whys root cause analysis, and preventive measures
          </p>
        </div>
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono font-bold text-sm">
          FMEA RPN: {rpn}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Failure Metadata & RCA</CardTitle>
            <CardDescription>Decompose root causes and operational circumstances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Failure Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Acoustic Fatigue Cracking in Resonator Wall Liners"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Executive Summary *</Label>
              <Input
                id="summary"
                placeholder="Brief summary of failure mode and observed physical damage..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Severity (1-10) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Occurrence (1-10) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={occurrence}
                  onChange={(e) => setOccurrence(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Detectability (1-10) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={detectability}
                  onChange={(e) => setDetectability(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rootCause">Root Cause Analysis (RCA) *</Label>
              <textarea
                id="rootCause"
                rows={4}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs"
                placeholder="Primary physical mechanism responsible for structural failure..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correctiveActions">Corrective & Mitigation Actions *</Label>
              <Input
                id="correctiveActions"
                placeholder="Immediate redesign steps implemented to fix failure..."
                value={correctiveActions}
                onChange={(e) => setCorrectiveActions(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessonsLearned">Lessons Learned *</Label>
              <Input
                id="lessonsLearned"
                placeholder="What should never be repeated in future iterations..."
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? 'Publishing Failure Record...' : 'Publish Failure Record'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
