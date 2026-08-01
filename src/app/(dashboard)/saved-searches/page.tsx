import React from 'react';
import { Search, Save, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SavedSearchesPage() {
  const searches = await prisma.savedSearch.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Searches Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access saved multi-parameter queries and automated search alerts
          </p>
        </div>
        <Badge variant="verified" className="w-fit text-sm px-3 py-1">
          {searches.length} Saved Queries
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searches.length > 0 ? (
          searches.map((s) => (
            <Card key={s.id} className="border-border hover:border-primary/40 transition-all shadow-sm">
              <CardHeader className="space-y-2">
                <Badge variant="outline" className="w-fit text-[10px] font-mono">SAVED SEARCH</Badge>
                <CardTitle className="text-base font-bold">{s.name}</CardTitle>
                <CardDescription className="font-mono text-xs text-blue-400">Query: "{s.query}"</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/discovery?q=${encodeURIComponent(s.query)}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Execute Query <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No saved searches logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
