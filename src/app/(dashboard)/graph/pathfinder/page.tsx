'use client';

import React, { useState } from 'react';
import { Share2, ArrowRight, Zap, Layers, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function PathfinderPage() {
  const { toast } = useToast();
  const [computing, setComputing] = useState(false);
  const [pathResult, setPathResult] = useState<any>(null);

  const handleComputePath = async () => {
    setComputing(true);
    try {
      const res = await fetch('/api/graph/nodes');
      const data = await res.json();

      const sourceId = data.nodes?.[0]?.id;
      const targetId = data.nodes?.[2]?.id || data.nodes?.[1]?.id;

      if (!sourceId || !targetId) {
        toast({ title: 'Graph Node Error', description: 'At least 2 nodes required for traversal', type: 'error' });
        return;
      }

      const pathRes = await fetch('/api/graph/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId }),
      });

      const pathData = await pathRes.json();
      setPathResult(pathData.path);
      toast({ title: 'Pathfinder Execution Complete', description: 'Shortest relationship path calculated', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Pathfinder Error', description: err.message, type: 'error' });
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Dijkstra Graph Traversal Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Graph Pathfinder Workbench</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover multi-hop relationship paths connecting distant problems, failures, and solutions
          </p>
        </div>
        <Button variant="brand" onClick={handleComputePath} disabled={computing}>
          {computing ? 'Calculating Traversal Path...' : 'Find Shortest Relationship Path'}
        </Button>
      </div>

      {/* Path Result */}
      {pathResult ? (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="verified">
                {pathResult.hopCount} HOPS • TOTAL WEIGHT {pathResult.totalWeight}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">Traversal Execution Verified</span>
            </div>
            <CardTitle className="text-lg mt-2">Shortest Knowledge Connection Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {pathResult.nodes.map((node: any, idx: number) => (
                <React.Fragment key={node.id}>
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px]">{node.type}</Badge>
                      <h4 className="font-bold text-sm">{node.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">Step #{idx + 1}</span>
                  </div>
                  {idx < pathResult.nodes.length - 1 && (
                    <div className="flex justify-center my-1">
                      <Badge variant="secondary" className="text-[10px]">
                        ↓ {pathResult.edges[idx]?.relationshipType || 'SOLVES'}
                      </Badge>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center text-sm text-muted-foreground space-y-2">
          <Share2 className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
          <p className="font-semibold">No active pathfinder run.</p>
          <p className="text-xs">Click "Find Shortest Relationship Path" to compute graph traversals between knowledge entities.</p>
        </Card>
      )}
    </div>
  );
}
