import React from 'react';
import { Database, ShieldCheck, ArrowRight, ExternalLink, FileCheck2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TraceabilityExplorerPage() {
  const records = await prisma.evidenceRecord.findMany({
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
          <h1 className="text-3xl font-extrabold tracking-tight">Evidence Traceability Graph</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit origin chains connecting claims to empirical test records, lab standards, and verified artifacts
          </p>
        </div>
        <Badge variant="verified" className="w-fit text-sm px-3 py-1">
          {records.length} Traceable Records Verified
        </Badge>
      </div>

      {/* Traceability Graph Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Traceability Audit Log</CardTitle>
          <CardDescription>Click any evidence node to trace upstream physical test reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-border bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px]">
                      STRENGTH {r.evidenceStrengthScore}/100
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{r.domain.name} • {r.evidenceType}</span>
                  </div>
                  <h4 className="font-bold text-sm">{r.title}</h4>
                  <p className="text-xs text-muted-foreground">Source: {r.source} {r.standardsRef && `| ${r.standardsRef}`}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-muted-foreground">Audited by {r.contributor.fullName}</span>
                  <Link href="/evidence">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      Inspect Traceability Chain <ArrowRight className="w-3 h-3 ml-1" />
                    </Badge>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
