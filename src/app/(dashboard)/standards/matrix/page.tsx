import React from 'react';
import { FileCheck2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { evaluateComplianceReadiness } from '@/lib/standards/compliance-engine';

export const dynamic = 'force-dynamic';

export default async function ComplianceMatrixPage() {
  const mappings = await prisma.complianceMapping.findMany({
    include: {
      knowledgeEntry: { select: { title: true } },
      standard: { select: { standardNumber: true, officialPublisher: true } },
      hierarchyNode: { select: { identifier: true, title: true } },
      reviewer: { select: { fullName: true } },
      evidenceRecord: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const matrixItems = mappings.map((m) => ({
    id: m.id,
    knowledgeTitle: m.knowledgeEntry?.title || 'System Requirement Mapping',
    standardNumber: m.standard.standardNumber,
    clauseIdentifier: m.hierarchyNode?.identifier || 'General Scope',
    complianceStatus: m.complianceStatus,
    verificationStatus: m.verificationStatus,
    reviewerName: m.reviewer?.fullName || 'Certified Compliance Verifier',
    hasEvidence: !!m.evidenceRecordId,
    openIssues: m.openIssues,
  }));

  const readiness = evaluateComplianceReadiness(matrixItems);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Compliance Matrix & Audit Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time audit matrix mapping knowledge entries and empirical test evidence against standards
          </p>
        </div>
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm">
          READINESS SCORE: {readiness.readinessPercentage}% ({readiness.rating})
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mapped Compliance Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-foreground">{readiness.totalMapped}</span>
            <p className="text-xs text-muted-foreground mt-1">Total mapped clauses</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliant & Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-emerald-400">{readiness.compliantCount}</span>
            <p className="text-xs text-muted-foreground mt-1">Backed by empirical evidence</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Missing Evidence Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-amber-400">{readiness.missingEvidenceCount}</span>
            <p className="text-xs text-muted-foreground mt-1">Requires evidence linking</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Matrix Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Compliance Audit Matrix</CardTitle>
          <CardDescription>Live matrix updating as evidence and verification decisions occur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappings.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-border bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px]">{m.complianceStatus}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {m.standard.standardNumber} ({m.hierarchyNode?.identifier || 'General'})
                    </span>
                  </div>
                  <h4 className="font-bold text-sm">{m.knowledgeEntry?.title || 'System Clause Mapping'}</h4>
                  {m.complianceNotes && <p className="text-xs text-muted-foreground">{m.complianceNotes}</p>}
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span>Audited by <strong className="text-foreground">{m.reviewer?.fullName || 'Certified Verifier'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
