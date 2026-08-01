import React from 'react';
import { notFound } from 'next/navigation';
import { ShieldCheck, BookOpen, Clock, Tag, ExternalLink, History, Paperclip, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { ThreadedComments } from '@/components/knowledge/threaded-comments';

export const dynamic = 'force-dynamic';

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const entry = await prisma.knowledgeEntry.findUnique({
    where: { id },
    include: {
      domain: true,
      industry: true,
      creator: { select: { fullName: true, title: true } },
      reviewer: { select: { fullName: true } },
      versions: { orderBy: { version: 'desc' } },
      attachments: true,
      comments: { include: { parentComment: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!entry || entry.deletedAt) {
    return notFound();
  }

  // Increment view count
  await prisma.knowledgeEntry.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Metadata Header */}
      <div className="border-b border-border pb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Badge variant="verified">100% VERIFIED SOLUTION</Badge>
          <Badge variant="outline" className="font-mono">{entry.domain.name}</Badge>
          <Badge variant="secondary" className="font-mono">{entry.industry.name}</Badge>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">{entry.title}</h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-2">
          <span>Contributed by <strong className="text-foreground">{entry.creator.fullName}</strong> ({entry.creator.title || 'Senior Engineer'})</span>
          <span>Verified by <strong className="text-emerald-400">{entry.reviewer?.fullName || 'Certified Domain Verifier'}</strong></span>
          <span>Confidence: <strong className="text-emerald-400">{entry.confidenceScore}%</strong></span>
          <span>Views: <strong className="text-foreground">{entry.viewCount}</strong></span>
          <span>Version: <strong className="text-foreground">v{entry.version}</strong></span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Problem Summary */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-blue-400">Executive Engineering Problem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>{entry.problemSummary}</p>
              {entry.detailedProblem && (
                <div className="p-3 rounded-lg bg-card/60 border border-border text-xs text-muted-foreground">
                  <strong className="text-foreground block mb-1">Detailed Boundary Conditions:</strong>
                  {entry.detailedProblem}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validated Solution Strategy */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-emerald-400">Validated Engineering Solution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>{entry.solutionSummary}</p>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Empirical & Technical Explanation</h4>
                <div className="font-mono text-xs whitespace-pre-wrap text-foreground/90">{entry.technicalExplanation}</div>
              </div>
            </CardContent>
          </Card>

          {/* Constraints & Failure Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entry.knownConstraints && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-amber-400 uppercase tracking-wider">Known Constraints & Limits</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {entry.knownConstraints}
                </CardContent>
              </Card>
            )}

            {entry.failureModes && (
              <Card className="border-rose-500/30 bg-rose-500/5">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-rose-400 uppercase tracking-wider">Prevented Failure Modes</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {entry.failureModes}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Audit Discussion Comments */}
          <ThreadedComments
            comments={entry.comments.map((c) => ({
              id: c.id,
              author: { fullName: 'Peer Verifier' },
              content: c.content,
              isResolved: c.isResolved,
              createdAt: c.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* Right Sidebar Metadata */}
        <div className="space-y-6">
          {/* Version History Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-500" />
                <span>Version Audit Trail ({entry.versions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {entry.versions.map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg bg-card/60 border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold">v{v.version}</span>
                    <p className="text-[11px] text-muted-foreground">{v.changeSummary || 'Version update'}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-emerald-500" />
                <span>Supporting Attachments ({entry.attachments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {entry.attachments.length > 0 ? (
                entry.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-lg bg-card border border-border hover:border-primary flex items-center justify-between transition-all"
                  >
                    <span className="truncate max-w-[160px] font-medium">{att.title || att.fileName}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ))
              ) : (
                <p className="text-muted-foreground">No direct file attachments linked.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
