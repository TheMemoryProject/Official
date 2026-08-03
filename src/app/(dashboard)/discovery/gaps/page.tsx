import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function GapsPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Knowledge Gaps"
      subtitle="Missing knowledge the organization does not yet realize it lacks."
      opportunities={data.knowledgeGaps}
      footnote="Gaps are inferred from where analogous problems elsewhere were solved, but no equivalent knowledge exists here."
    />
  );
}
