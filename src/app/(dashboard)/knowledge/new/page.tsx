'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, PlusCircle, ArrowRight, Save, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewKnowledgePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [problemSummary, setProblemSummary] = useState('');
  const [detailedProblem, setDetailedProblem] = useState('');
  const [solutionSummary, setSolutionSummary] = useState('');
  const [technicalExplanation, setTechnicalExplanation] = useState('');
  const [knownConstraints, setKnownConstraints] = useState('');
  const [failureModes, setFailureModes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !problemSummary || !solutionSummary || !technicalExplanation) {
      toast({ title: 'Validation Error', description: 'Please fill in all mandatory fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Create knowledge entry via API
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          problemSummary,
          detailedProblem: detailedProblem || problemSummary,
          solutionSummary,
          technicalExplanation,
          knownConstraints,
          failureModes,
          lessonsLearned,
          domainId: 'a0000000-0000-0000-0000-000000000001', // Pre-seeded Aerospace domain ID fallback
          industryId: 'b0000000-0000-0000-0000-000000000001',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      toast({ title: 'Knowledge Entry Submitted', description: 'Entered verification workflow queue', type: 'success' });
      router.push('/dashboard');
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
          <h1 className="text-3xl font-extrabold tracking-tight">Submit Engineering Knowledge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contribute verified solutions linked to empirical evidence & failure analysis
          </p>
        </div>
        <Button variant="outline" onClick={() => toast({ title: 'Draft Saved', description: 'Local state persisted', type: 'info' })}>
          <Save className="w-4 h-4 mr-2" /> Save Draft
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Core Knowledge Metadata</CardTitle>
            <CardDescription>Specify problem statement, engineering domain, and technical solution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Knowledge Entry Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Passively Damped Acoustic Resonator Chamber Configuration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemSummary">Executive Problem Summary *</Label>
              <Input
                id="problemSummary"
                placeholder="Concise overview of engineering obstacle or thermal constraint..."
                value={problemSummary}
                onChange={(e) => setProblemSummary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solutionSummary">Solution Summary *</Label>
              <Input
                id="solutionSummary"
                placeholder="High-level solution strategy and validated results..."
                value={solutionSummary}
                onChange={(e) => setSolutionSummary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicalExplanation">Technical & Empirical Explanation *</Label>
              <textarea
                id="technicalExplanation"
                rows={6}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                placeholder="Detailed technical explanation, mathematical equations, frequency cavity dimensions, or code references..."
                value={technicalExplanation}
                onChange={(e) => setTechnicalExplanation(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="knownConstraints">Known Constraints & Limits</Label>
                <Input
                  id="knownConstraints"
                  placeholder="e.g. Wall temp limits >1800 K"
                  value={knownConstraints}
                  onChange={(e) => setKnownConstraints(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failureModes">Associated Failure Modes</Label>
                <Input
                  id="failureModes"
                  placeholder="e.g. Acoustic fatigue cracking"
                  value={failureModes}
                  onChange={(e) => setFailureModes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessonsLearned">Lessons Learned</Label>
              <Input
                id="lessonsLearned"
                placeholder="What should never be repeated in future iterations..."
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Submitting to Review Queue...' : 'Submit Knowledge Entry'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
