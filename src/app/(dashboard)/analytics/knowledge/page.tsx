import React from 'react';
import { BookOpen, TrendingUp, ShieldCheck, CheckCircle2, ArrowRight, Layers, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function KnowledgeAnalyticsPage() {
  const domains = await prisma.engineeringDomain.findMany({
    include: {
      knowledge: true,
      failures: true,
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Knowledge Growth & Gap Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluate knowledge coverage, domain completeness, and identify critical engineering knowledge gaps
        </p>
      </div>

      {/* Domain Coverage Breakdown */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Engineering Domain Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((dom) => (
            <Card key={dom.id} className="border-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">{dom.code}</Badge>
                <span className="text-xs text-muted-foreground font-semibold">{dom.knowledge.length} Entries</span>
              </div>
              <h4 className="font-bold text-base">{dom.name}</h4>
              <p className="text-xs text-muted-foreground">{dom.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-border">
                <span>Failures Recorded: <strong className="text-rose-400">{dom.failures.length}</strong></span>
                <span>Completeness: <strong className="text-emerald-400">92%</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
