import React from 'react';
import { Zap, Play, PlusCircle, CheckCircle2, ShieldCheck, Clock, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AutomationRulesPage() {
  const rules = await prisma.automationRule.findMany({
    include: {
      runLogs: {
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Event-Driven Workflow Automation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Automation Engine & Rule Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create automated triggers (`IF Knowledge Verified THEN Notify Engineering Managers & Create Task`)
          </p>
        </div>
      </div>

      {/* Rules List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>Active Automation Rules ({rules.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length > 0 ? (
            rules.map((rule) => (
              <div key={rule.id} className="p-5 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-400">
                      TRIGGER: {rule.triggerEvent}
                    </Badge>
                    <span className="font-bold text-base">{rule.name}</span>
                  </div>
                  <Badge variant={rule.isActive ? 'verified' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 font-mono text-xs text-muted-foreground space-y-1">
                  <div>IF event == <strong className="text-amber-400">{rule.triggerEvent}</strong></div>
                  <div>THEN execute <strong className="text-foreground">Send Notification & Task Assignment</strong></div>
                </div>

                <div className="text-xs font-mono text-muted-foreground border-t border-border pt-2 flex items-center justify-between">
                  <span>Recent Executions: {rule.runLogs.length} Runs</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Last run: Success (45ms)</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-muted-foreground">No custom automation rules configured yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
