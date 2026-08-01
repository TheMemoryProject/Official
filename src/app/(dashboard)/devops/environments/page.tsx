import React from 'react';
import { Globe, CheckCircle2, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EnvironmentsManagerPage() {
  const environments = await prisma.deploymentEnvironmentConfig.findMany({
    orderBy: { envName: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Multi-Region Cloud & On-Premises Environments</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Environment & Cluster Configurator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage production, staging, development, and air-gapped environment replicas, regions, and storage providers
          </p>
        </div>
      </div>

      {/* Environments List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Configured Deployment Environments ({environments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {environments.map((env) => (
            <div key={env.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="verified" className="text-[10px]">{env.envName}</Badge>
                  <span className="font-bold text-sm font-mono">Region: {env.region}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono block">
                  Max Replicas: {env.maxReplicas} • Storage Provider: {env.storageProvider}
                </span>
              </div>
              <Badge variant={env.isMaintenanceMode ? 'destructive' : 'outline'} className="font-mono">
                {env.isMaintenanceMode ? 'MAINTENANCE_MODE' : 'ACTIVE'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
