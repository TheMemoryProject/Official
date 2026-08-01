import React from 'react';
import { HardDrive, CheckCircle2, ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BackupsManagerPage() {
  const backups = await prisma.systemBackupRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Automated Database Snapshots & Recovery Validation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Disaster Recovery & Backup Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated database snapshots, configuration backups, SHA-256 checksum verifications, and restore points
          </p>
        </div>
      </div>

      {/* Backup Records Grid */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Completed System Snapshots ({backups.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {backups.map((b) => (
            <div key={b.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="verified" className="text-[10px]">{b.status}</Badge>
                  <span className="font-bold text-sm">{b.backupType}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono block">
                  Size: {b.sizeMb} MB • Checksum: {b.checksum} • Trigger: {b.createdBy}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-400">
                Restore Point <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
