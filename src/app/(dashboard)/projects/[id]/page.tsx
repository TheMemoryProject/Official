import React from 'react';
import { FolderKanban, BookOpen, Layers, CheckCircle2, ShieldCheck, Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProjectWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const project = await prisma.engineeringProject.findUnique({
    where: { id: params.id },
    include: {
      program: { select: { name: true } },
      domain: { select: { name: true } },
      industry: { select: { name: true } },
      owner: { select: { fullName: true, email: true } },
      milestones: true,
      knowledge: {
        include: {
          domain: { select: { name: true } },
          attachments: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
            {project.code}
          </Badge>
          <Badge variant="verified">{project.status}</Badge>
          <Badge variant="secondary" className="text-[10px]">{project.phase}</Badge>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.description}</p>
        <div className="flex items-center space-x-4 text-xs font-mono text-muted-foreground pt-1">
          <span>Owner: <strong className="text-foreground">{project.owner.fullName}</strong></span>
          <span>Domain: <strong className="text-foreground">{project.domain.name}</strong></span>
          <span>Program: <strong className="text-foreground">{project.program.name}</strong></span>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Milestones */}
        <Card className="border-border md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Project Milestones</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.milestones.length > 0 ? (
              project.milestones.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{m.name}</span>
                    <Badge variant="outline" className="text-[9px]">{m.status}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    Due: {new Date(m.dueDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-3 text-center">No milestones created.</p>
            )}
          </CardContent>
        </Card>

        {/* Linked Verified Knowledge */}
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Linked Verified Knowledge ({project.knowledge.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.knowledge.length > 0 ? (
              project.knowledge.map((k) => (
                <div key={k.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="verified" className="text-[9px]">{k.verificationStatus}</Badge>
                      <span className="font-bold text-sm">{k.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{k.solutionSummary}</p>
                  </div>
                  <Link href={`/knowledge/${k.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-blue-400">
                      Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-6 text-center">No knowledge entries directly assigned to this project yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
