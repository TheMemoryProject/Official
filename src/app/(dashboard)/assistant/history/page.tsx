import React from 'react';
import { Bot, MessageSquare, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SavedConversationsPage() {
  const conversations = await prisma.engineeringConversation.findMany({
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Saved Engineering Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review saved AI-assisted engineering investigations, source citations, and grounded evidence queries
        </p>
      </div>

      {/* Conversations List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Saved Conversations ({conversations.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div key={conv.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">{conv.title}</h4>
                  <span className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleString()}</span>
                </div>
                <Link href="/assistant">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-400">
                    Open Conversation <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No saved engineering conversations recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
