import React from 'react';
import { Network, PlusCircle, RefreshCw, Activity, CheckCircle2, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IntegrationsCenterPage() {
  const connectors = await prisma.integrationConnector.findMany({
    where: { archivedAt: null },
    include: {
      owner: { select: { fullName: true } },
      organization: { select: { name: true } },
      fieldMappings: true,
      webhooks: true,
      syncJobs: { take: 1, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Network className="w-3.5 h-3.5" />
            <span>Enterprise Integration & Data Lineage Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Integration Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect PLM, ERP, QMS, CAD, Git, and Document Management systems with automated field mapping & provenance tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/integrations/new">
            <Button variant="brand" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" /> Add System Connector
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of Connected Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.length > 0 ? (
          connectors.map((c) => (
            <Card key={c.id} className="border-border hover:border-blue-500/40 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="verified">{c.status}</Badge>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
                    {c.healthStatus}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>{c.name}</span>
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground">{c.connectorType} • {c.syncDirection}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-lg bg-card/60 border border-border text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Endpoint:</span>
                    <strong className="text-foreground font-mono truncate max-w-[140px]">{c.baseUrl || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Mapped Fields:</span>
                    <strong className="text-foreground">{c.fieldMappings.length} Fields</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last Sync:</span>
                    <strong className="text-emerald-400">{c.lastSync ? new Date(c.lastSync).toLocaleTimeString() : 'Never'}</strong>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border bg-card/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono text-[11px]">Owner: {c.owner.fullName}</span>
                <Link href="/integrations/jobs">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-400">
                    Sync Jobs <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No enterprise connectors configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
