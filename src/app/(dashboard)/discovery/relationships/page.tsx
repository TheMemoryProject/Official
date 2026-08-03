import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function RelationshipsPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Hidden Engineering Relationships"
      subtitle="Candidate relationships the knowledge graph does not yet assert. Human verification required."
      opportunities={data.hiddenRelationships}
      footnote="These surfaced from the graph, not from a search. Verify each candidate before it becomes an asserted edge."
    />
  );
}
