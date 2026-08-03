import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lightbulb, GitMerge, Link2, Layers, AlertTriangle, Repeat, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { InnovationOpportunity, OpportunityKind } from '@/lib/innovation/innovation-engine';

const KIND_META: Record<OpportunityKind, { label: string; variant: 'verified' | 'unverified' | 'admin' | 'default' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
  TRANSFER: { label: 'Solution Transfer', variant: 'verified', icon: <Repeat className="w-3.5 h-3.5" /> },
  ANALOGY: { label: 'Engineering Analogy', variant: 'admin', icon: <Layers className="w-3.5 h-3.5" /> },
  SIMILAR_PROBLEM: { label: 'Similar Problem', variant: 'verified', icon: <GitMerge className="w-3.5 h-3.5" /> },
  HIDDEN_RELATIONSHIP: { label: 'Hidden Relationship', variant: 'unverified', icon: <Link2 className="w-3.5 h-3.5" /> },
  GAP: { label: 'Knowledge Gap', variant: 'destructive', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  RECURRING_FAILURE: { label: 'Recurring Failure', variant: 'destructive', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  EMERGING_THEME: { label: 'Emerging Theme', variant: 'admin', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  RECOMMENDATION: { label: 'Innovation Recommendation', variant: 'default', icon: <Lightbulb className="w-3.5 h-3.5" /> },
};

interface OpportunityCardProps {
  opportunity: InnovationOpportunity;
  detailHref?: string;
}

export function OpportunityCard({ opportunity, detailHref }: OpportunityCardProps) {
  const meta = KIND_META[opportunity.kind] || KIND_META.RECOMMENDATION;
  return (
    <Card className="p-5 border-border hover:border-blue-500/40 transition-all duration-200 shadow-sm flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={meta.variant} className="text-[10px]">
          <span className="inline-flex items-center gap-1">
            {meta.icon}
            {meta.label}
          </span>
        </Badge>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {opportunity.confidence}% conf.
        </span>
      </div>

      <h4 className="font-bold text-sm leading-snug">{opportunity.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{opportunity.description}</p>

      <div className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-lg p-2.5 leading-relaxed">
        <span className="text-foreground/80 font-semibold">Why:</span> {opportunity.explanation}
      </div>

      {opportunity.sourceDomain && (
        <div className="flex items-center gap-1.5 text-[11px]">
          <Badge variant="outline" className="text-[10px]">{opportunity.sourceDomain}</Badge>
          {opportunity.targetDomain && (
            <>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">{opportunity.targetDomain}</Badge>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${opportunity.requiresVerification ? 'text-amber-500' : 'text-emerald-500'}`}>
          {opportunity.requiresVerification ? 'Awaiting verification' : 'Evidence-backed'}
        </span>
        {detailHref && (
          <Link href={detailHref} className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
            Inspect <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </Card>
  );
}

export function KindBadge({ kind }: { kind: OpportunityKind }) {
  const meta = KIND_META[kind] || KIND_META.RECOMMENDATION;
  return (
    <Badge variant={meta.variant} className="text-[10px]">
      {meta.label}
    </Badge>
  );
}

export function EnginePulse() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
      <Sparkles className="w-3.5 h-3.5" />
      Innovation Engine Active
    </span>
  );
}
