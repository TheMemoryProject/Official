import React from 'react';
import { BookOpen, ShieldCheck, PlusCircle, ArrowRight, Layers, FileCheck2, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StandardsLibraryPage() {
  const standards = await prisma.standardRecord.findMany({
    include: {
      domain: { select: { name: true, code: true } },
      industry: { select: { name: true, code: true } },
      hierarchyNodes: true,
      revisions: true,
      complianceMappings: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Standards & Compliance Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect verified engineering knowledge to ISO, ASME, IEEE, RTCA, SAE, and MIL-STD compliance requirements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/standards/matrix">
            <Button variant="outline" size="sm">
              <FileCheck2 className="w-4 h-4 mr-2 text-blue-500" /> Compliance Matrix
            </Button>
          </Link>
          <Link href="/standards/impact">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2 text-purple-500" /> Impact Analysis
            </Button>
          </Link>
          <Link href="/standards/new">
            <Button variant="brand" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Standard
            </Button>
          </Link>
        </div>
      </div>

      {/* Standards Family Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {standards.length > 0 ? (
          standards.map((std) => (
            <Card key={std.id} className="border-border hover:border-blue-500/40 transition-all shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs text-blue-400 border-blue-500/40">
                    {std.standardFamily}
                  </Badge>
                  <Badge variant="verified">{std.status}</Badge>
                </div>
                <CardTitle className="text-base font-bold line-clamp-2">{std.standardNumber}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">{std.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-lg bg-card/60 border border-border text-xs space-y-1">
                  <span className="font-semibold text-muted-foreground">Publisher & Revision:</span>
                  <p className="font-mono text-foreground">{std.officialPublisher} ({std.revision})</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Addressable Clauses: <strong className="text-foreground">{std.hierarchyNodes.length}</strong></span>
                  <span>Compliance Mappings: <strong className="text-emerald-400">{std.complianceMappings.length}</strong></span>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border bg-card/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono text-[11px]">{std.domain.name}</span>
                <Link href={`/standards/${std.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-400">
                    Browse Clauses <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No engineering standards currently indexed.
          </div>
        )}
      </div>
    </div>
  );
}
