import React from 'react';
import { Network, PlusCircle, Activity, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function WebhooksManagerPage() {
  const webhooks = await prisma.integrationWebhook.findMany({
    include: {
      connector: { select: { name: true, connectorType: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-time Event Webhook Gateway</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Webhook Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure inbound/outbound event webhooks, payload signatures, and delivery audit history
        </p>
      </div>

      {/* Webhooks List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Network className="w-4 h-4 text-purple-500" />
            <span>Configured Enterprise Webhooks ({webhooks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.length > 0 ? (
            webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified">{wh.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    <span className="font-bold text-sm">{wh.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{wh.connector.name}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground truncate">
                  Endpoint: {wh.endpointUrl}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
                  <span>Direction: <strong className="text-foreground">{wh.direction}</strong></span>
                  <span>Deliveries: <strong className="text-emerald-400">{wh.deliveryCount}</strong></span>
                  <span>Last Status: <strong className="text-emerald-400">{wh.lastDeliveryStatus || 'N/A'}</strong></span>
                  <span>Secret Key: <strong className="text-foreground font-mono">••••••••••••</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No enterprise webhooks currently configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
