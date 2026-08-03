import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OpportunityCard, EnginePulse } from '@/components/innovation/opportunity-card';
import type { InnovationOpportunity } from '@/lib/innovation/innovation-engine';

interface DiscoveryListProps {
  title: string;
  subtitle: string;
  opportunities: InnovationOpportunity[];
  footnote?: string;
}

export function DiscoveryList({ title, subtitle, opportunities, footnote }: DiscoveryListProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <EnginePulse />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="outline" className="text-xs font-mono shrink-0 w-fit">
          {opportunities.length} candidate discoveries
        </Badge>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-xl border border-border bg-card/40">
          <p className="text-sm text-muted-foreground">No candidate discoveries in this category yet. The engine will surface them as more verified knowledge enters the network.</p>
        </div>
      )}

      {footnote && (
        <p className="text-[11px] text-muted-foreground border-t border-border pt-4">{footnote}</p>
      )}
    </div>
  );
}
