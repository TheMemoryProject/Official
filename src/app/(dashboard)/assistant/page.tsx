'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, ExternalLink, Bookmark, Info, HelpCircle, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  citations?: any[];
  confidenceScore?: number;
  scoreExplanation?: string;
}

export default function AIAssistedEngineeringWorkspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ASSISTANT',
      content:
        'Welcome to the AI-Assisted Engineering Workspace. I am strictly grounded in verified KTN engineering records. I will never fabricate solutions, generate unbacked recommendations, or invent citations.',
      confidenceScore: 100,
      scoreExplanation: '100% Grounded in Peer-Verified Knowledge Base',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery;
    setInputQuery('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'USER',
      content: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, conversationId }),
      });

      const data = await res.json();
      if (res.ok) {
        if (!conversationId) setConversationId(data.conversationId);

        const citations = JSON.parse(data.message.citationsJson || '[]');

        const assistantMsg: Message = {
          id: data.message.id,
          sender: 'ASSISTANT',
          content: data.message.content,
          citations,
          confidenceScore: data.message.confidenceScore,
          scoreExplanation: data.message.scoreExplanation,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Workspace Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Hallucination Engineering Assistant</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI-Assisted Engineering Workspace</h1>
        </div>
        <Link href="/assistant/history">
          <Button variant="outline" size="sm" className="text-xs">
            Saved Conversations
          </Button>
        </Link>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border border-border bg-card/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'} space-y-2`}
          >
            <div
              className={`max-w-3xl p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'USER'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-card border border-border text-foreground rounded-bl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Citations & Traceability Cards */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Verified Source Citations ({msg.citations.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.citations.map((c: any, idx: number) => (
                      <Link
                        key={idx}
                        href={c.link}
                        className="p-2.5 rounded-lg bg-accent/60 border border-border hover:border-blue-500/40 transition-all flex items-center justify-between text-xs text-foreground group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Badge variant="verified" className="text-[9px]">{c.type}</Badge>
                          <span className="font-semibold truncate">{c.title}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-400 shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Score & Explanation */}
              {msg.confidenceScore !== undefined && (
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Confidence: <strong className="text-emerald-400">{msg.confidenceScore}%</strong></span>
                  <span className="truncate max-w-md">{msg.scoreExplanation}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="p-4 rounded-xl bg-card border border-border text-xs text-muted-foreground animate-pulse">
            Executing permission checks & retrieving verified engineering evidence...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center space-x-3 pt-2">
        <Input
          type="text"
          placeholder="Ask an engineering question grounded strictly in verified KTN knowledge..."
          className="flex-1 h-12 text-sm rounded-xl border-border bg-card shadow-sm"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={loading} className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500">
          <Send className="w-4 h-4 mr-2" />
          Query
        </Button>
      </form>
    </div>
  );
}
