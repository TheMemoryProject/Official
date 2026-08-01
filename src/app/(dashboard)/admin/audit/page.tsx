import React from 'react';
import { FileText, ShieldCheck, Lock, Activity, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AuditLogExplorerPage() {
  const auditLogs = await prisma.securityAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Tamper-proof Immutable Security Log</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security Audit Log Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chronological immutable audit log of administrative events, permission edits, user logins, and settings updates
        </p>
      </div>

      {/* Audit Log Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Audit Events ({auditLogs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px] font-mono">{log.action}</Badge>
                    <span className="font-bold text-sm">{log.resource}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{log.details}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Actor: <strong className="text-foreground">{log.actorEmail}</strong></span>
                  <span>IP Address: <strong className="text-foreground font-mono">{log.ipAddress}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No security audit events recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
