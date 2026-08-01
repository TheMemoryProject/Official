import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function IncidentManagerPage() {
  const incidents = await prisma.systemIncident.findMany({
    include: {
      owner: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Operational Reliability & Postmortem Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Incident Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track operational outages, root cause analysis, affected services, and resolution timelines
          </p>
        </div>
      </div>

      {/* Incidents List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Incident Records ({incidents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">{inc.severity}</Badge>
                    <span className="font-bold text-base">{inc.title}</span>
                  </div>
                  <Badge variant="verified">{inc.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Affected Service: <strong className="text-foreground">{inc.affectedService}</strong></p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Zero active incidents reported. All systems operating normally.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
