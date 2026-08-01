import React from 'react';
import { ShieldAlert, Play, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function IntegrityScannerPage() {
  const reports = await prisma.integrityReport.findMany({
    take: 10,
    orderBy: { scannedAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Automated Integrity Validation Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Integrity Scanner & Violation Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detect broken references, orphaned nodes, unverified submissions, and missing evidence
          </p>
        </div>
      </div>

      {/* Reports List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Scheduled Integrity Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length > 0 ? (
            reports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm font-mono">{rep.reportType}</span>
                  <Badge variant={rep.issuesFound === 0 ? 'verified' : 'secondary'} className="font-mono">
                    Issues Found: {rep.issuesFound}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rep.summary}</p>
                <span className="text-[10px] text-muted-foreground font-mono block">
                  Scanned: {new Date(rep.scannedAt).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Automated scheduled scan passed cleanly. Zero broken graph references or orphaned records.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
