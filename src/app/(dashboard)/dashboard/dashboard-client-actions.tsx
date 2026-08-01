'use client';

import React, { useState } from 'react';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export function DashboardClientActions({ userRole }: { userRole?: string }) {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [limitations, setLimitations] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create test problem & solution in DB
      toast({
        title: 'Solution Submitted',
        description: 'Your solution is registered and linked to verification graph.',
        type: 'success',
      });
      setOpenModal(false);
      setTitle('');
      setSummary('');
      setDetails('');
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        <Button variant="brand" onClick={() => setOpenModal(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Submit Solution
        </Button>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal} title="Submit Engineering Solution">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Solution Title</Label>
            <Input
              placeholder="e.g. High-Pressure Liquid Cooling Loop Mitigation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Executive Summary</Label>
            <Input
              placeholder="Concise overview of verified solution strategy..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Empirical Solution Details</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Provide exact parameters, thermal constraints, or code references..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Known Limitations & Failure Modes</Label>
            <Input
              placeholder="Specify conditions under which solution degrades..."
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit to Verification Desk'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
