import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function AnalogiesPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Engineering Analogies"
      subtitle="Multi-dimensional similarity beyond keywords: shared physics, failure mechanisms, and function."
      opportunities={data.analogies}
      footnote="Analogical reasoning is a core innovation engine. A solution that worked under similar physics in one domain may transfer."
    />
  );
}
