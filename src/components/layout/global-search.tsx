'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, AlertTriangle, FileText, ArrowRight, Tag } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/solutions?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setResults(data.solutions || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Global Knowledge Search">
      <div className="space-y-4">
        {/* Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by engineering domain, limitation, evidence..."
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
            autoFocus
          />
        </div>

        {/* Status / Quick Filters */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground pt-1">
          <span>Quick Filters:</span>
          <button
            onClick={() => handleSearch('Microservices')}
            className="bg-muted hover:bg-accent px-2 py-1 rounded-md transition-colors"
          >
            #Microservices
          </button>
          <button
            onClick={() => handleSearch('Memory Leak')}
            className="bg-muted hover:bg-accent px-2 py-1 rounded-md transition-colors"
          >
            #Memory Leak
          </button>
          <button
            onClick={() => handleSearch('High Availability')}
            className="bg-muted hover:bg-accent px-2 py-1 rounded-md transition-colors"
          >
            #HA
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pt-2">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Searching verified engineering database...
            </div>
          ) : results.length > 0 ? (
            results.map((sol) => (
              <div
                key={sol.id}
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/dashboard#solution-${sol.id}`);
                }}
                className="p-3.5 rounded-lg border border-border bg-card/60 hover:bg-accent hover:border-primary/40 cursor-pointer transition-all flex items-start justify-between group"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {sol.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{sol.summary}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-muted-foreground pt-1">
                    <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                      {sol.domain?.name || 'General'}
                    </span>
                    <span>•</span>
                    <span>{sol.industry?.name || 'Aerospace'}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
            ))
          ) : query.trim() ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No verified solutions match "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
              <p>Type keywords to search verified engineering knowledge.</p>
              <p className="opacity-70">Supports searches across failure records, domain tags, and evidence titles.</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
