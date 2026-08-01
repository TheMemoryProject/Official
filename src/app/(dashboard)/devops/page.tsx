import React from 'react';
import { Server, ShieldCheck, CheckCircle2, GitBranch, Layers, Cpu, Globe, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DevOpsControlCenterPage() {
  const deployments = await prisma.systemDeploymentRecord.findMany({
    orderBy: { deployedAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Server className="w-3.5 h-3.5" />
            <span>Infrastructure as Code & CI/CD Pipeline Automation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">DevOps & Deployment Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated deployment history, release engineering workflows, Helm/Kubernetes manifests, and deployment mode controls
          </p>
        </div>
        <Link href="/devops/environments">
          <Button variant="outline" size="sm" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> Environment Manager
          </Button>
        </Link>
      </div>

      {/* Deployment History Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span>Deployment Audit History ({deployments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deployments.length > 0 ? (
            deployments.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                      ENV: {d.environment}
                    </Badge>
                    <span className="font-bold text-sm">KTN Platform {d.version}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">
                    Mode: {d.deploymentMode} • Triggered By: {d.deployedBy}
                  </span>
                </div>
                <Badge variant="verified">{d.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No deployments recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
