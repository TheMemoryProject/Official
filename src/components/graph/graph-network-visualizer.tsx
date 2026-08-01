'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, Activity, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NodeItem {
  id: string;
  name: string;
  type: string;
}

interface EdgeItem {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
}

export function GraphNetworkVisualizer({
  nodes,
  edges,
  onSelectNode,
}: {
  nodes: NodeItem[];
  edges: EdgeItem[];
  onSelectNode: (node: NodeItem) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-[520px] rounded-2xl border border-border bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col justify-between p-6">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {nodes.length} Nodes • {edges.length} Edges
          </Badge>
          <Badge variant="verified">Verified Knowledge Graph</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg bg-card border border-border hover:bg-accent text-xs font-semibold">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-card border border-border hover:bg-accent text-xs font-semibold">
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Network Map */}
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <svg className="w-full h-full">
          {/* Edge Lines */}
          <line x1="20%" y1="50%" x2="50%" y2="25%" stroke="rgba(59,130,246,0.4)" strokeWidth="2" />
          <line x1="50%" y1="25%" x2="80%" y2="50%" stroke="rgba(16,185,129,0.4)" strokeWidth="2" />
          <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="rgba(168,85,247,0.4)" strokeWidth="2" strokeDasharray="4" />
          <line x1="20%" y1="50%" x2="50%" y2="75%" stroke="rgba(245,158,11,0.4)" strokeWidth="2" />

          {/* Interactive Nodes */}
          {nodes.slice(0, 5).map((node, i) => {
            const coords = [
              { x: '20%', y: '50%' },
              { x: '50%', y: '25%' },
              { x: '80%', y: '50%' },
              { x: '50%', y: '75%' },
              { x: '35%', y: '35%' },
            ][i] || { x: '50%', y: '50%' };

            const isSelected = selectedNodeId === node.id;

            return (
              <g
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectNode(node);
                }}
                className="cursor-pointer group"
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? '24' : '18'}
                  className={
                    isSelected
                      ? 'fill-blue-600 stroke-white stroke-2 shadow-lg transition-all duration-300'
                      : 'fill-slate-800 stroke-blue-500/50 hover:fill-blue-500/20 transition-all'
                  }
                />
                <text
                  x={coords.x}
                  y={coords.y}
                  dy="4"
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold pointer-events-none"
                >
                  {node.name.substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Drawer Card */}
      {selectedNode && (
        <div className="z-10 self-start max-w-sm p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
              {selectedNode.type}
            </span>
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-bold">{selectedNode.name}</h4>
          <p className="text-xs text-muted-foreground">Click connected nodes in the canvas to inspect relationship evidence.</p>
        </div>
      )}
    </div>
  );
}
