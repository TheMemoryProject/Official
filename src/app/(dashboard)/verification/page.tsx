import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VerificationDeskPage() {
  const pendingEntries = await prisma.knowledgeEntry.findMany({
    where: { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, deletedAt: null },
    include: {
      domain: { select: { name: true } },
      industry: { select: { name: true } },
      creator: { select: { fullName: true } },
      attachments: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reviewer Verification Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit knowledge submissions, verify empirical evidence, and publish to cross-domain search index
          </p>
        </div>
        <Badge variant="verified" className="w-fit text-sm px-3 py-1">
          {pendingEntries.length} Submissions Pending Review
        </Badge>
      </div>

      {/* Verification Queue List */}
      <div className="space-y-4">
        {pendingEntries.length > 0 ? (
          pendingEntries.map((entry) => (
            <Card key={entry.id} className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                      PENDING VERIFICATION
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {entry.domain.name} • {entry.industry.name}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.problemSummary}</p>
                  <div className="flex items-center space-x-4 text-[11px] text-muted-foreground pt-1">
                    <span>Submitted by: <strong className="text-foreground">{entry.creator.fullName}</strong></span>
                    <span>Attachments: <strong className="text-foreground">{entry.attachments.length}</strong></span>
                    <span>Date: {new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <Link href={`/knowledge/${entry.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> Inspect Audit Details
                    </Button>
                  </Link>
                  <Button variant="verify" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verify & Publish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="font-semibold text-foreground">Verification Queue Clear!</p>
            <p className="text-xs">All submitted engineering knowledge entries have been audited and published.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
