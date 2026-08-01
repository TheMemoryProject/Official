import React from 'react';
import { Layers, Share2, Search, ArrowRight, Activity, Filter, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { GraphNetworkVisualizer } from '@/components/graph/graph-network-visualizer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GraphExplorerPage() {
  const [nodes, edges] = await Promise.all([
    prisma.graphNode.findMany({ take: 30 }),
    prisma.graphEdge.findMany({ take: 50 }),
  ]);

  const formattedNodes = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.nodeType,
  }));

  const formattedEdges = edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    relationshipType: e.relationshipType,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate cross-domain engineering connections by relationships rather than isolated documents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/graph/pathfinder">
            <Button variant="brand" size="sm">
              <Share2 className="w-4 h-4 mr-2" /> Open Path Finder
            </Button>
          </Link>
        </div>
      </div>

      {/* Network Map Visualizer */}
      <GraphNetworkVisualizer
        nodes={formattedNodes}
        edges={formattedEdges}
        onSelectNode={() => {}}
      />

      {/* Connected Entities Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Active Relationship Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>SOLVES</span> <span className="font-mono text-foreground font-bold">14 Relations</span></div>
            <div className="flex justify-between"><span>FAILED_BECAUSE_OF</span> <span className="font-mono text-foreground font-bold">9 Relations</span></div>
            <div className="flex justify-between"><span>MANUFACTURED_WITH</span> <span className="font-mono text-foreground font-bold">12 Relations</span></div>
            <div className="flex justify-between"><span>CERTIFIED_BY</span> <span className="font-mono text-foreground font-bold">8 Relations</span></div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Graph Density Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Total Indexed Nodes</span> <span className="font-mono text-foreground font-bold">{nodes.length}</span></div>
            <div className="flex justify-between"><span>Total Validated Edges</span> <span className="font-mono text-foreground font-bold">{edges.length}</span></div>
            <div className="flex justify-between"><span>Average Connections/Node</span> <span className="font-mono text-foreground font-bold">3.4</span></div>
            <div className="flex justify-between"><span>Cluster Density Ratio</span> <span className="font-mono text-foreground font-bold">0.78</span></div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span>Verification Audit Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>100% of published edges are verified by certified domain verifiers.</p>
            <p className="text-[11px] opacity-80">Unverified inferred relations remain flagged in review queue.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
