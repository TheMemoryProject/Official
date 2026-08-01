'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, PlusCircle, ArrowRight, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewStandardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [standardNumber, setStandardNumber] = useState('');
  const [standardFamily, setStandardFamily] = useState('ISO');
  const [revision, setRevision] = useState('2021 Edition');
  const [officialPublisher, setOfficialPublisher] = useState('ISO / International Organization for Standardization');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !standardNumber || !description) {
      toast({ title: 'Validation Error', description: 'Please fill in all mandatory standard fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          standardNumber,
          standardFamily,
          revision,
          officialPublisher,
          description,
          scope: scope || description,
          domainId: 'a0000000-0000-0000-0000-000000000001',
          industryId: 'b0000000-0000-0000-0000-000000000001',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create standard record');

      toast({ title: 'Standard Family Registered', description: 'Added to compliance library', type: 'success' });
      router.push('/standards');
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
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-500">Register Engineering Standard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Index ISO, ASME, IEEE, RTCA, SAE, or custom company compliance standards
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Standard Metadata & Jurisdiction</CardTitle>
            <CardDescription>Specify standard family, official publisher, and revision numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardNumber">Standard Number / Designation *</Label>
                <Input
                  id="standardNumber"
                  placeholder="e.g. ISO 9001:2015 or RTCA DO-178C"
                  value={standardNumber}
                  onChange={(e) => setStandardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standardFamily">Standard Family *</Label>
                <Input
                  id="standardFamily"
                  placeholder="e.g. ISO, ASME, RTCA, SAE, IEEE, MIL-STD"
                  value={standardFamily}
                  onChange={(e) => setStandardFamily(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Full Standard Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Quality management systems — Requirements"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="officialPublisher">Official Publisher *</Label>
                <Input
                  id="officialPublisher"
                  placeholder="e.g. ISO / International Organization for Standardization"
                  value={officialPublisher}
                  onChange={(e) => setOfficialPublisher(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revision">Revision / Edition *</Label>
                <Input
                  id="revision"
                  placeholder="e.g. 2015 Edition or Rev D"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Standard Summary & Rules *</Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                placeholder="High-level description of governing engineering principles and mandatory rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Applicable Engineering Scope</Label>
              <Input
                id="scope"
                placeholder="e.g. Applicable to high-pressure thermal boundary systems..."
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Registering Standard...' : 'Register Standard'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
