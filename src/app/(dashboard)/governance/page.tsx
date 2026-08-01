import React from 'react';
import { ShieldCheck, Lock, Award, FileText, CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GovernanceCenterPage() {
  const policies = await prisma.governancePolicy.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Data Governance & Compliance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Governance Center & Security Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enforce enterprise security classifications (ITAR, EAR, Confidential), retention schedules, and verification governance
          </p>
        </div>
      </div>

      {/* Governance Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border p-6 space-y-3 bg-card hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <Award className="w-5 h-5 text-emerald-400" />
            <Badge variant="verified" className="text-[10px]">Quality Engine</Badge>
          </div>
          <h3 className="font-bold text-lg">Knowledge Quality Dashboard</h3>
          <p className="text-xs text-muted-foreground">Monitor completeness, evidence coverage, and overall quality score distribution.</p>
          <div className="pt-2">
            <Link href="/governance/quality">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Quality Analytics <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border-border p-6 space-y-3 bg-card hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <Badge variant="secondary" className="text-[10px]">Scanner</Badge>
          </div>
          <h3 className="font-bold text-lg">Integrity & Scanner</h3>
          <p className="text-xs text-muted-foreground">Automated scheduled scans detecting broken references, unverified entries, and orphaned data.</p>
          <div className="pt-2">
            <Link href="/governance/integrity">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Integrity Scanner <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border-border p-6 space-y-3 bg-card hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <Lock className="w-5 h-5 text-amber-400" />
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">Classifications</Badge>
          </div>
          <h3 className="font-bold text-lg">Classification & ITAR</h3>
          <p className="text-xs text-muted-foreground">Manage ITAR, EAR, Controlled Technical Info, and Company Confidential tags.</p>
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full text-xs" disabled>
              Classifications Active
            </Button>
          </div>
        </Card>
      </div>

      {/* Governance Policies Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Active Governance Policies ({policies.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {policies.length > 0 ? (
            policies.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
                      {p.classification}
                    </Badge>
                    <span className="font-bold text-sm">{p.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">
                    Retention Schedule: {p.retentionYears} Years • Type: {p.policyType}
                  </span>
                </div>
                <Badge variant={p.isActive ? 'verified' : 'secondary'}>
                  {p.isActive ? 'Enforced' : 'Draft'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Default Enterprise Governance Policy enforced (ITAR / EAR Restricted • 10-Year Retention).</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
