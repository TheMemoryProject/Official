'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, ArrowRight, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function IngestionWizardPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<any[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ingestion/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalFilename: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          documentType: 'TEST_REPORT',
          fileSize: 2048000,
          rawText: 'Sample test report for thermoacoustic cavity damping',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingestion failed');

      setExtractedEntities(data.document?.extractedEntities || []);
      setStep(2);
      toast({ title: 'Document Ingested & Extracted', description: 'Entities extracted with page traceability', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Knowledge Ingestion Wizard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import engineering documents (PDF, DOCX, CSV) and extract verified knowledge records
          </p>
        </div>
        <Badge variant="outline">Step {step} of 2</Badge>
      </div>

      {step === 1 ? (
        <Card className="border-border">
          <form onSubmit={handleUpload}>
            <CardHeader>
              <CardTitle className="text-lg">Document Upload & Parsing</CardTitle>
              <CardDescription>Select document and configure extraction rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="docTitle">Document Title *</Label>
                <Input
                  id="docTitle"
                  placeholder="e.g. Propulsion System Test Qualification Report #402"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 bg-card/40">
                <Upload className="w-10 h-10 text-blue-500 mx-auto" />
                <p className="text-sm font-semibold">Drag & drop engineering PDF, DOCX, or CSV file</p>
                <p className="text-xs text-muted-foreground">Supports files up to 50 MB with OCR page parsing</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" variant="brand" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting Entities...
                  </>
                ) : (
                  <>
                    Trigger Extraction Pipeline <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Extracted Entities & Source Traceability</span>
            </CardTitle>
            <CardDescription>Review extracted fields before publishing to knowledge index</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedEntities.map((ent, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card border border-border flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px]">
                      {ent.entityType}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {ent.sectionName} (Page {ent.pageNumber})
                    </span>
                  </div>
                  <p className="text-sm font-medium">{ent.extractedText}</p>
                </div>
                <Badge variant="outline">{ent.confidence}% Confidence</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Upload Another Document
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                toast({ title: 'Approved & Indexed', description: 'Extracted entities published to Knowledge Base', type: 'success' });
                setStep(1);
                setTitle('');
              }}
            >
              Approve & Publish to Knowledge Base
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
