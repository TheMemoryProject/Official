import React from 'react';
import { AlertTriangle, ShieldAlert, PlusCircle, ArrowRight, Activity, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FailuresPage() {
  const failures = await prisma.failureRecord.findMany({
    where: { deletedAt: null },
    include: {
      domain: { select: { name: true } },
      industry: { select: { name: true } },
      contributor: { select: { fullName: true } },
    },
    orderBy: { rpn: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Failure Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Learn from documented physical failures, FMEA metrics, and 5-Whys root cause analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/failures/analytics">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2 text-rose-500" /> Failure Analytics
            </Button>
          </Link>
          <Link href="/failures/new">
            <Button variant="brand" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" /> Report Failure
            </Button>
          </Link>
        </div>
      </div>

      {/* Failure Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {failures.length > 0 ? (
          failures.map((f) => {
            const rpnColor =
              f.rpn >= 500
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                : f.rpn >= 250
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-blue-500/40 bg-blue-500/10 text-blue-400';

            return (
              <Card key={f.id} className="border-border hover:border-rose-500/40 transition-all shadow-sm flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${rpnColor}`}>
                      RPN {f.rpn} ({f.severity}S × {f.occurrence}O × {f.detectability}D)
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{f.domain.name}</span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-2">{f.title}</CardTitle>
                  <CardDescription className="line-clamp-3 text-xs">{f.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                    <span className="font-semibold text-rose-400">Root Cause:</span>
                    <p className="text-muted-foreground line-clamp-2">{f.rootCause}</p>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span>Lessons Learned: </span>
                    <p className="font-medium line-clamp-2">{f.lessonsLearned}</p>
                  </div>
                </CardContent>
                <div className="p-4 border-t border-border bg-card/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[140px]">By {f.contributor.fullName}</span>
                  <Link href={`/failures/new`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-400">
                      View RCA <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No failure records currently documented.
          </div>
        )}
      </div>
    </div>
  );
}
