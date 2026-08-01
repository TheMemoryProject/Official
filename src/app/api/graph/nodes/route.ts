import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { findShortestPath } from '@/lib/graph/traversal-engine';

export async function GET() {
  try {
    const [nodes, edges] = await Promise.all([
      prisma.graphNode.findMany({ take: 100 }),
      prisma.graphEdge.findMany({ take: 200 }),
    ]);

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sourceId, targetId } = await request.json();

    const [nodes, edges] = await Promise.all([
      prisma.graphNode.findMany(),
      prisma.graphEdge.findMany(),
    ]);

    const formattedNodes = nodes.map((n) => ({ id: n.id, name: n.name, type: n.nodeType }));
    const formattedEdges = edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      relationshipType: e.relationshipType,
      weight: e.weight,
    }));

    const path = findShortestPath(sourceId, targetId, formattedNodes, formattedEdges);

    return NextResponse.json({ path });
  } catch (error) {
    console.error('Pathfinder API error:', error);
    return NextResponse.json({ error: 'Failed to compute graph path' }, { status: 500 });
  }
}
