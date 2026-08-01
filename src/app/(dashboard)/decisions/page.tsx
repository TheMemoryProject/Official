import React from 'react';
import { Layers, ShieldCheck, PlusCircle, ArrowRight, GitCommit, FileCheck2, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DecisionsWorkspacePage() {
  const decisions = await prisma.engineeringDecision.findMany({
    where: { archivedAt: null },
    include: {
      domain: { select: { name: true, code: true } },
      industry: { select: { name: true, code: true } },
      owner: { select: { fullName: true, title: true } },
      knowledgeEntry: { select: { title: true } },
      tasks: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Decision Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documented rationale, alternatives considered, tradeoffs, and formal technical approvals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/decisions/new">
            <Button variant="brand" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" /> Draft Decision Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decisions.length > 0 ? (
          decisions.map((d) => (
            <Card key={d.id} className="border-border hover:border-blue-500/40 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="verified">{d.status}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">v{d.version}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-2">{d.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{d.decisionSummary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <span className="font-semibold text-emerald-400">Chosen Option:</span>
                  <p className="font-medium text-foreground line-clamp-2">{d.chosenOption}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Linked Tasks: <strong className="text-foreground">{d.tasks.length}</strong></span>
                  <span>Owner: <strong className="text-foreground">{d.owner.fullName}</strong></span>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border bg-card/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono text-[11px]">{d.domain.name}</span>
                <Link href={`/decisions/${d.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-400">
                    Inspect Rationale <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No engineering decisions currently documented.
          </div>
        )}
      </div>
    </div>
  );
}
