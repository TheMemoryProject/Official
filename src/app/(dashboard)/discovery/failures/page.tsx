import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function FailuresPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Recurring Failure Mechanisms"
      subtitle="Identical root mechanisms appearing across multiple domains."
      opportunities={data.recurringFailures}
      footnote="Failure knowledge is treated as first-class: learning from failures in one domain can prevent them in another."
    />
  );
}
