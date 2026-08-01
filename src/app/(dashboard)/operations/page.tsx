import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, Cpu, HardDrive, Database, Server, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { calculateSystemHealthScore } from '@/lib/operations/observability-engine';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OperationsCenterPage() {
  const services = await prisma.systemHealthRecord.findMany({
    orderBy: { serviceName: 'asc' },
  });

  const summary = calculateSystemHealthScore(services);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Mission-Critical Enterprise Observability & Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Operations Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status monitoring, subsystem latencies, error tracking, incidents, and platform reliability controls
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/operations/flags">
            <Button variant="outline" size="sm" className="text-xs">
              Feature Flags
            </Button>
          </Link>
          <Link href="/operations/incidents">
            <Button variant="outline" size="sm" className="text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" /> Incidents Desk
            </Button>
          </Link>
          <Link href="/operations/backups">
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700">
              <HardDrive className="w-3.5 h-3.5 mr-1.5" /> Disaster Recovery & Backups
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-mono block">PLATFORM HEALTH SCORE</span>
          <div className="text-3xl font-extrabold mt-2 text-emerald-400">{summary.overallHealthScore} / 100</div>
          <span className="text-xs text-emerald-500 font-semibold mt-1 inline-block">System Status: {summary.status}</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-mono block">ESTIMATED UPTIME (30 DAYS)</span>
          <div className="text-3xl font-extrabold mt-2 text-foreground">{summary.uptimePercentage}%</div>
          <span className="text-xs text-muted-foreground font-mono mt-1 inline-block">Target SLA: 99.95% Uptime</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-mono block">ACTIVE INCIDENTS</span>
          <div className="text-3xl font-extrabold mt-2 text-foreground">{summary.activeIncidents}</div>
          <span className="text-xs text-muted-foreground font-mono mt-1 inline-block">Zero Critical Outages</span>
        </Card>
      </div>

      {/* Subsystems Status Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Subsystem Health & Latencies ({services.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((svc) => (
            <div key={svc.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="verified" className="text-[10px]">{svc.status}</Badge>
                  <span className="font-bold text-sm">{svc.serviceName}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono block">
                  Latency: {svc.latencyMs}ms • Memory: {svc.memoryMb} MB • Error Rate: {svc.errorRate}%
                </span>
              </div>
              <Badge variant="outline" className="font-mono border-emerald-500/40 text-emerald-400">
                Score: {svc.healthScore}/100
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
