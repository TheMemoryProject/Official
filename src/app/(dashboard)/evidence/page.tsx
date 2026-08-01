import React from 'react';
import { FileCheck2, ShieldCheck, PlusCircle, ArrowRight, ExternalLink, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EvidencePage() {
  const evidenceRecords = await prisma.evidenceRecord.findMany({
    where: { deletedAt: null },
    include: {
      domain: { select: { name: true } },
      industry: { select: { name: true } },
      contributor: { select: { fullName: true } },
    },
    orderBy: { evidenceStrengthScore: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Evidence & Traceability Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empirical test reports, FEA stress analyses, ISO/ASME standards, and calibration logs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/evidence/traceability">
            <Button variant="outline" size="sm">
              <Database className="w-4 h-4 mr-2 text-blue-500" /> Traceability Explorer
            </Button>
          </Link>
          <Link href="/evidence/new">
            <Button variant="brand" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Evidence Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evidenceRecords.length > 0 ? (
          evidenceRecords.map((ev) => (
            <Card key={ev.id} className="border-border hover:border-emerald-500/40 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="verified">
                    {ev.evidenceStrengthScore}/100 STRENGTH SCORE
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{ev.evidenceType}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-2">{ev.title}</CardTitle>
                <CardDescription className="line-clamp-3 text-xs">{ev.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-lg bg-card/60 border border-border text-xs space-y-1">
                  <span className="font-semibold text-emerald-400">Original Source:</span>
                  <p className="text-muted-foreground truncate">{ev.source}</p>
                </div>
                {ev.standardsRef && (
                  <div className="text-[11px] text-muted-foreground">
                    <span>Standards Compliance: </span>
                    <strong className="text-blue-400">{ev.standardsRef}</strong>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t border-border bg-card/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[140px]">By {ev.contributor.fullName}</span>
                <Link href="/evidence/traceability">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-400">
                    Explore Graph <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No empirical evidence records currently stored.
          </div>
        )}
      </div>
    </div>
  );
}
