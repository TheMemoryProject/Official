import React from 'react';
import { Briefcase, FolderKanban, PlusCircle, Layers, ArrowRight, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsDashboardPage() {
  const [projects, portfolios] = await Promise.all([
    prisma.engineeringProject.findMany({
      include: {
        program: { select: { name: true } },
        domain: { select: { name: true } },
        milestones: true,
        knowledge: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.engineeringPortfolio.findMany({
      include: {
        programs: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Enterprise Engineering Workspaces & Portfolios</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Projects & Portfolios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize engineering knowledge, failure records, decisions, and evidence inside living engineering project workspaces
          </p>
        </div>
      </div>

      {/* Portfolios Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolios.map((port) => (
          <Card key={port.id} className="border-border p-6 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <Badge variant="verified" className="text-[10px]">{port.status}</Badge>
              <span className="text-xs font-mono text-muted-foreground">Budget: ${port.budget.toLocaleString()}</span>
            </div>
            <h3 className="font-bold text-lg">{port.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{port.description}</p>
            <div className="pt-2 text-xs font-mono text-muted-foreground">
              Programs: <strong className="text-foreground">{port.programs.length} Active Programs</strong>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Projects List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <span>Active Engineering Project Workspaces ({projects.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length > 0 ? (
            projects.map((prj) => (
              <div key={prj.id} className="p-5 rounded-xl border border-border bg-card/60 space-y-3 hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                      {prj.code}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{prj.phase}</Badge>
                    <span className="font-bold text-base">{prj.name}</span>
                  </div>
                  <Badge variant="verified">{prj.status}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">{prj.description}</p>

                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border pt-3">
                  <span>Domain: {prj.domain.name} • Program: {prj.program.name}</span>
                  <Link href={`/projects/${prj.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400">
                      Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No engineering projects recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
