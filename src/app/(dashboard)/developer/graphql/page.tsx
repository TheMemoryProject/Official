'use client';

import React, { useState } from 'react';
import { Cpu, Play, Terminal, CheckCircle2, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function GraphQLExplorerPage() {
  const [query, setQuery] = useState(`query GetKnowledgeEntries {
  knowledgeEntries {
    id
    title
    verificationStatus
    confidenceScore
  }
}`);

  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResponse(JSON.stringify({ error: e.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive GraphQL Playground</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">GraphQL Explorer & Schema Viewer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute strongly-typed GraphQL queries with field selection and schema introspection
          </p>
        </div>
      </div>

      {/* Playground Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="border-border flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold font-mono">Query Editor</CardTitle>
            <Button size="sm" onClick={handleExecute} disabled={loading} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
              <Play className="w-3 h-3 mr-1" /> Run Query
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-80 bg-black/80 font-mono text-xs text-blue-300 p-4 rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </CardContent>
        </Card>

        {/* Response Viewer */}
        <Card className="border-border flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold font-mono">Response JSON</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <pre className="w-full h-80 bg-black/80 font-mono text-xs text-emerald-400 p-4 rounded-xl border border-border overflow-auto">
              {loading ? 'Executing GraphQL query...' : response || '// Response will appear here after execution'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
