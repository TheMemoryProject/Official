export interface PathNode {
  id: string;
  name: string;
  type: string;
}

export interface PathEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  weight: number;
}

export interface TraversalPath {
  nodes: PathNode[];
  edges: PathEdge[];
  totalWeight: number;
  hopCount: number;
}

export function findShortestPath(
  sourceId: string,
  targetId: string,
  allNodes: PathNode[],
  allEdges: PathEdge[]
): TraversalPath | null {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Array<{ neighbor: string; edge: PathEdge }>>();

  allEdges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)?.push({ neighbor: edge.target, edge });
    adjacency.get(edge.target)?.push({ neighbor: edge.source, edge });
  });

  const queue: Array<{ current: string; pathNodes: PathNode[]; pathEdges: PathEdge[]; weight: number }> = [
    {
      current: sourceId,
      pathNodes: [nodeMap.get(sourceId)!].filter(Boolean),
      pathEdges: [],
      weight: 0,
    },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { current, pathNodes, pathEdges, weight } = queue.shift()!;

    if (current === targetId) {
      return {
        nodes: pathNodes,
        edges: pathEdges,
        totalWeight: weight,
        hopCount: pathEdges.length,
      };
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current) || [];
    for (const { neighbor, edge } of neighbors) {
      if (!visited.has(neighbor) && nodeMap.has(neighbor)) {
        queue.push({
          current: neighbor,
          pathNodes: [...pathNodes, nodeMap.get(neighbor)!],
          pathEdges: [...pathEdges, edge],
          weight: weight + edge.weight,
        });
      }
    }
  }

  return null;
}
