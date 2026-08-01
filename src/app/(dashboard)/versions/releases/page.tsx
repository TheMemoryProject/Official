import React from 'react';
import { Package, PlusCircle, ShieldCheck, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReleaseManagerPage() {
  const releases = await prisma.knowledgeRelease.findMany({
    include: {
      publisher: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Release Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group verified engineering revisions, standards updates, and knowledge packages into formal enterprise releases
          </p>
        </div>
      </div>

      {/* Releases List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span>Published & Planned Releases ({releases.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {releases.length > 0 ? (
            releases.map((rel) => (
              <div key={rel.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified" className="text-[10px] font-mono">{rel.releaseNumber}</Badge>
                    <span className="font-bold text-sm">{rel.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{rel.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rel.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Publisher: <strong className="text-foreground">{rel.publisher.fullName}</strong></span>
                  <span>Published: <strong className="text-foreground">{rel.publishedAt ? new Date(rel.publishedAt).toLocaleDateString() : 'Planned'}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No enterprise releases recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
