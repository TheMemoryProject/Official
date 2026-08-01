'use client';

import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Reply, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';

interface Comment {
  id: string;
  author: { fullName: string };
  content: string;
  isResolved: boolean;
  createdAt: string;
}

export function ThreadedComments({ comments: initialComments }: { comments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: Comment = {
      id: Math.random().toString(),
      author: { fullName: 'Active User' },
      content: newComment,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };

    setComments([item, ...comments]);
    setNewComment('');
    toast({ title: 'Comment Posted', description: 'Review comment added to audit trail', type: 'success' });
  };

  const toggleResolve = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isResolved: !c.isResolved } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <span>Audit Review Comments ({comments.length})</span>
        </h3>
      </div>

      {/* New Comment Input */}
      <form onSubmit={handlePost} className="space-y-3">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Add verification notes, audit feedback, or peer review comments..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" variant="brand" size="sm">
            Post Review Note
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar name={c.author.fullName} size="sm" />
                <span className="text-xs font-bold">{c.author.fullName}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <Button
                variant={c.isResolved ? 'verify' : 'outline'}
                size="sm"
                onClick={() => toggleResolve(c.id)}
                className="h-7 text-[11px]"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {c.isResolved ? 'Resolved' : 'Mark Resolved'}
              </Button>
            </div>
            <p className="text-xs text-foreground/90 pl-10">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
