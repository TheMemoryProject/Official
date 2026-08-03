import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Innovation Opportunities"
      subtitle="Explainable, evidence-backed recommendations the engine generated without a query."
      opportunities={data.recommendations}
      footnote="Every recommendation traces to knowledge, evidence, or a candidate relationship. Nothing is asserted as truth until a human verifies it."
    />
  );
}
