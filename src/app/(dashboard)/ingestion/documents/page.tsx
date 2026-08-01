import React from 'react';
import { Upload, FileText, CheckCircle2, ShieldCheck, Clock, Layers, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IngestedDocumentsLibraryPage() {
  const documents = await prisma.ingestedDocument.findMany({
    include: {
      contributor: { select: { fullName: true } },
      extractedEntities: true,
      ingestionJobs: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Upload className="w-3.5 h-3.5" />
            <span>Multi-Stage Extraction & Provenance Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ingested Documents Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise PDF, CAD spec, test report & qualification document parser with page-level entity extraction
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/ingestion/queue">
            <Button variant="outline" size="sm" className="text-xs">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Processing Queue Monitor
            </Button>
          </Link>
          <Link href="/ingestion/wizard">
            <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Ingested Documents Grid */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Processed Engineering Documents ({documents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="p-5 rounded-xl border border-border bg-card/60 space-y-3 hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                      {doc.documentType}
                    </Badge>
                    <span className="font-bold text-base">{doc.title}</span>
                  </div>
                  <Badge variant="verified">{doc.processingStatus}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-muted-foreground bg-muted/40 p-3 rounded-lg">
                  <div>File: <strong className="text-foreground">{doc.originalFilename}</strong></div>
                  <div>Confidence: <strong className="text-emerald-400">{doc.extractionConfidence}%</strong></div>
                  <div>Entities Extracted: <strong className="text-foreground">{doc.extractedEntities.length}</strong></div>
                  <div>Contributor: <strong className="text-foreground">{doc.contributor.fullName}</strong></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No ingested documents in library.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
