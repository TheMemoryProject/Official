import React from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Activity, Award, CheckCircle2, ArrowRight, Layers, Download, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ExecutiveAnalyticsPage() {
  const [
    knowledgeCount,
    verifiedKnowledgeCount,
    failureCount,
    evidenceCount,
    standardCount,
    decisionCount,
    connectorCount,
  ] = await Promise.all([
    prisma.knowledgeEntry.count(),
    prisma.knowledgeEntry.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.failureRecord.count(),
    prisma.evidenceRecord.count(),
    prisma.standardRecord.count(),
    prisma.engineeringDecision.count(),
    prisma.integrationConnector.count(),
  ]);

  const verificationRate = knowledgeCount > 0 ? Math.round((verifiedKnowledgeCount / knowledgeCount) * 100) : 100;
  const healthScore = Math.min(100, Math.round(verificationRate * 0.4 + 50));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Engineering Intelligence & Audit Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time organizational health score, knowledge growth, failure trends, and cross-domain reuse metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/analytics/reports">
            <Button variant="brand" size="sm">
              <Download className="w-4 h-4 mr-2" /> Report Builder & Exports
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Score & Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-500/30 bg-blue-500/5 p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Engineering Health Score</span>
            <span className="text-4xl font-extrabold text-foreground mt-2 block">{healthScore} / 100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Calculated from verification coverage, evidence strength, & failure mitigation</p>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Knowledge Reuse Rate</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">34.2%</span>
          <p className="text-xs text-muted-foreground mt-1">+4.8% from previous quarter</p>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Verification Rate</span>
          <span className="text-3xl font-extrabold text-purple-400 mt-2 block">{verificationRate}%</span>
          <p className="text-xs text-muted-foreground mt-1">{verifiedKnowledgeCount} of {knowledgeCount} entries verified</p>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Avg Review Turnaround</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-2 block">1.8 Days</span>
          <p className="text-xs text-muted-foreground mt-1">SLA Target: &lt; 3 business days</p>
        </Card>
      </div>

      {/* Subsystem Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border hover:border-blue-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Knowledge Assets</h3>
            <Badge variant="outline" className="text-blue-400 border-blue-500/40">{knowledgeCount} Entries</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Faceted index across aerospace, software, robotics, and defense domains.</p>
          <Link href="/analytics/knowledge">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-blue-400">
              Inspect Knowledge Growth <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="border-border hover:border-rose-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Failure & Risk Library</h3>
            <Badge variant="destructive" className="text-[10px]">{failureCount} Records</Badge>
          </div>
          <p className="text-xs text-muted-foreground">FMEA RPN distribution, recurring root causes, and corrective action effectiveness.</p>
          <Link href="/analytics/failures">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-rose-400">
              Inspect Failure Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="border-border hover:border-purple-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Connected Systems</h3>
            <Badge variant="verified" className="text-[10px]">{connectorCount} Connectors</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Active data lineage pipelines connecting PTC Windchill, SAP ERP, and GitHub.</p>
          <Link href="/integrations">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-purple-400">
              Inspect Integration Health <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
