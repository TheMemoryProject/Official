import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';
import { DiscoveryList } from '@/components/innovation/discovery-list';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  const data = await getInnovationDashboard();
  return (
    <DiscoveryList
      title="Emerging Themes"
      subtitle="Physics and technology themes recurring across domains, monitored continuously."
      opportunities={data.emergingThemes}
      footnote="Themes that recur across multiple independent domains are leading indicators of where the next innovation will come from."
    />
  );
}
