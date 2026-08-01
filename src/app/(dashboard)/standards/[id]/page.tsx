import React from 'react';
import { notFound } from 'next/navigation';
import { BookOpen, ShieldCheck, Layers, FileCheck2, ArrowRight, History, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StandardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const standard = await prisma.standardRecord.findUnique({
    where: { id },
    include: {
      domain: true,
      industry: true,
      contributor: { select: { fullName: true } },
      reviewer: { select: { fullName: true } },
      hierarchyNodes: { orderBy: { orderIndex: 'asc' } },
      revisions: { orderBy: { releaseDate: 'desc' } },
      complianceMappings: {
        include: {
          knowledgeEntry: { select: { id: true, title: true } },
          failureRecord: { select: { id: true, title: true } },
          hierarchyNode: { select: { identifier: true, title: true } },
        },
      },
    },
  });

  if (!standard) return notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="font-mono text-xs text-blue-400 border-blue-500/40">
            {standard.standardFamily}
          </Badge>
          <Badge variant="verified">{standard.status}</Badge>
          <span className="text-xs font-mono text-muted-foreground">{standard.domain.name} • {standard.industry.name}</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">{standard.standardNumber}: {standard.title}</h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
          <span>Publisher: <strong className="text-foreground">{standard.officialPublisher}</strong></span>
          <span>Revision: <strong className="text-foreground">{standard.revision}</strong></span>
          <span>Jurisdiction: <strong className="text-foreground">{standard.jurisdiction}</strong></span>
          <span>Clauses Indexed: <strong className="text-emerald-400">{standard.hierarchyNodes.length}</strong></span>
        </div>
      </div>

      {/* Scope & Description */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold text-blue-400">Scope & Operational Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>{standard.description}</p>
          {standard.scope && (
            <div className="p-3 rounded-lg bg-card/60 border border-border text-xs text-muted-foreground">
              <strong className="text-foreground block mb-1">Standard Scope:</strong>
              {standard.scope}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Requirement Tree */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Hierarchical Requirement Tree ({standard.hierarchyNodes.length})</span>
          </CardTitle>
          <CardDescription>Addressable sections, clauses, and engineering requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {standard.hierarchyNodes.length > 0 ? (
            standard.hierarchyNodes.map((node) => (
              <div key={node.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {node.nodeType}
                    </Badge>
                    <span className="font-bold text-sm">{node.identifier}: {node.title}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{node.content}</p>
                {node.requirementText && (
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono">
                    <strong>Mandatory Rule: </strong>{node.requirementText}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No specific sub-clauses indexed for this standard record yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Linked Compliance Mappings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Linked Compliance Mappings ({standard.complianceMappings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {standard.complianceMappings.map((m) => (
            <div key={m.id} className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="verified" className="text-[10px]">{m.complianceStatus}</Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Clause: {m.hierarchyNode?.identifier || 'General'}
                  </span>
                </div>
                <h4 className="font-bold text-sm">{m.knowledgeEntry?.title || m.failureRecord?.title || 'Mapped Requirement'}</h4>
              </div>
              <Link href="/standards/matrix">
                <Button variant="ghost" size="sm" className="text-xs">
                  Matrix <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
