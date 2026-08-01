'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, ArrowRight, BookOpen, ShieldAlert, FileCheck2, Award, Zap, Layers, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SearchExplorerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchResults('');
  }, []);

  const fetchResults = async (qStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/search?q=${encodeURIComponent(qStr)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchResults(val);

    if (val.length >= 2) {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Main Search Bar */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deterministic Engineering Search & Knowledge Engine</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Enterprise Solution Discovery</h1>
        <p className="text-sm text-muted-foreground">
          Find verified engineering solutions, failure modes, test evidence, and standards across all industries
        </p>

        <div className="relative max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by keywords, materials, acoustic frequencies, or failure modes..."
              className="pl-12 pr-4 h-12 text-sm rounded-xl border-border bg-card shadow-lg focus:ring-2 focus:ring-blue-500"
              value={query}
              onChange={handleQueryChange}
            />
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 text-left overflow-hidden">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="w-full px-4 py-2.5 text-xs hover:bg-accent flex items-center justify-between text-foreground"
                  onClick={() => {
                    setQuery(sug);
                    setSuggestions([]);
                    fetchResults(sug);
                  }}
                >
                  <span>{sug}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Header & Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Search Results ({results.length})
          </span>
          <span className="text-xs font-mono text-muted-foreground">Deterministic Ranking Enabled</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Searching enterprise index...</div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((res) => (
              <Card key={res.id} className="border-border hover:border-blue-500/40 transition-all p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={res.type === 'KNOWLEDGE' ? 'default' : 'destructive'} className="text-[10px]">
                      {res.type}
                    </Badge>
                    <Badge variant="verified" className="text-[10px]">{res.verificationStatus}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{res.domainName} • {res.industryName}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-400">
                    Score {res.relevanceScore}/100
                  </Badge>
                </div>

                <h3 className="font-bold text-lg text-foreground">{res.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{res.summary}</p>

                <div className="p-2.5 rounded-lg bg-card/60 border border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                  <span>Explanation: {res.scoreExplanation}</span>
                  <Link href={res.type === 'KNOWLEDGE' ? `/knowledge/${res.id}` : `/failures`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400">
                      Open Record <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No matching verified engineering records found.
          </div>
        )}
      </div>
    </div>
  );
}
