import React from 'react';
import { Building2, ShieldCheck, CheckCircle2, UserPlus, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PartnersManagerPage() {
  const partnerships = await prisma.orgPartnership.findMany({
    include: {
      requesterOrg: { select: { name: true } },
      partnerOrg: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-400 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Cross-Organization Federation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Partner Organizations & Access Scopes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage trusted partner connections, shared access controls, and cross-organization verification requests
          </p>
        </div>
      </div>

      {/* Partnerships List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Active Partner Connections</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partnerships.length > 0 ? (
            partnerships.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px]">{p.status}</Badge>
                    <span className="font-bold text-sm">{p.requesterOrg.name} ↔ {p.partnerOrg.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">
                    Access Scope: {p.accessScope}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Default Partner Connection Active (Apex Engineering Labs ↔ Global Defense Consortium).</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
