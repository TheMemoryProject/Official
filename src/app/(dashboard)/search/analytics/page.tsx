import React from 'react';
import { Search, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SearchAnalyticsPage() {
  const searches = await prisma.searchHistoryItem.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Search & Discovery Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor popular search queries, zero-result terms, filter usage, and user navigation paths
        </p>
      </div>

      {/* Popular Queries & Analytics Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Search className="w-4 h-4 text-blue-500" />
            <span>Recent Query Logs & Match Yields</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {searches.length > 0 ? (
            searches.map((s) => (
              <div key={s.id} className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm font-mono">{s.query}</h4>
                  <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
                <Badge variant={s.resultCount > 0 ? 'verified' : 'destructive'} className="text-[10px]">
                  {s.resultCount} Results
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No search query logs recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
