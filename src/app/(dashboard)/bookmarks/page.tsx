import React from 'react';
import { Bookmark, Folder, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const bookmarks = await prisma.bookmark.findMany({
    include: {
      knowledgeEntry: {
        include: { domain: true, industry: true },
      },
      folder: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Knowledge & Bookmarks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize bookmarked solutions and research references into custom project folders
          </p>
        </div>
        <Badge variant="verified" className="w-fit text-sm px-3 py-1">
          {bookmarks.length} Bookmarked Entries
        </Badge>
      </div>

      {/* Bookmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.length > 0 ? (
          bookmarks.map((bm) => (
            <Card key={bm.id} className="border-border hover:border-primary/40 transition-all shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    {bm.folder?.name || 'Default Folder'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{bm.knowledgeEntry.domain.name}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-2">{bm.knowledgeEntry.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{bm.knowledgeEntry.solutionSummary}</p>
                <Link href={`/knowledge/new`}>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    Inspect Entry <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No bookmarks saved yet. Click the bookmark icon on any solution card to save it.
          </div>
        )}
      </div>
    </div>
  );
}
