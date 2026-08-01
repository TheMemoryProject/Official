import React from 'react';
import { GitPullRequest, PlusCircle, ShieldCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ChangeRequestsPage() {
  const changeRequests = await prisma.knowledgeChangeRequest.findMany({
    include: {
      requester: { select: { fullName: true } },
      affectedKnowledge: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Change Requests (ECR)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Formal change control workspace for submitting, reviewing, and approving engineering revisions
          </p>
        </div>
      </div>

      {/* ECR List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4 text-purple-500" />
            <span>Active Change Requests ({changeRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {changeRequests.length > 0 ? (
            changeRequests.map((ecr) => (
              <div key={ecr.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-400">
                      {ecr.ecrNumber}
                    </Badge>
                    <span className="font-bold text-sm">{ecr.title}</span>
                  </div>
                  <Badge variant="verified">{ecr.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ecr.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Reason: <strong className="text-foreground">{ecr.reasonForChange}</strong></span>
                  <span>Requester: <strong className="text-foreground">{ecr.requester.fullName}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No engineering change requests recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
