import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function TransfersPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Cross-Domain Discoveries"
      subtitle="Engineering knowledge from one domain that may solve problems in another."
      opportunities={data.crossDomainTransfers}
      footnote="Example: fatigue mitigation used in aerospace may benefit offshore wind turbines. These candidates require verification before reuse."
    />
  );
}
