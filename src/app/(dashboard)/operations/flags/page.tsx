import React from 'react';
import { ToggleLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FeatureFlagsPage() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-400 mb-2">
            <ToggleLeft className="w-3.5 h-3.5" />
            <span>Gradual Rollouts & Experimental Feature Toggles</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Feature Flag Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Safely roll out new features, perform canary deployments, and manage organizational feature flags
          </p>
        </div>
      </div>

      {/* Feature Flags Grid */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Configured Feature Flags ({flags.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/40 text-indigo-400">
                    KEY: {flag.key}
                  </Badge>
                  <span className="font-bold text-sm">{flag.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{flag.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-muted-foreground">{flag.rolloutPercentage}% Rollout</span>
                <Badge variant={flag.isEnabled ? 'verified' : 'secondary'}>
                  {flag.isEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
