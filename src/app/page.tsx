import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Rocket,
  Sparkles,
  RefreshCw,
  GitMerge,
  Link2,
  AlertTriangle,
  TrendingUp,
  Users,
  Layers,
  ShieldCheck,
  Database,
  Search,
  Network,
  FileCheck2,
  Lightbulb,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getInnovationDashboard, type InnovationDashboardData } from '@/lib/innovation/innovation-engine';
import { OpportunityCard, EnginePulse } from '@/components/innovation/opportunity-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'KTN - Engineering Innovation Discovery Platform',
  description: 'Continuously discover valuable engineering knowledge your organization does not yet realize it possesses.',
};

function MetricCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <Card className="border-border bg-card/50 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-3xl font-black mt-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </Card>
  );
}

function SectionHeader({ icon, title, subtitle, count, href }: { icon: React.ReactNode; title: string; subtitle: string; count?: number; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            {title}
            {typeof count === 'number' && (
              <Badge variant="outline" className="text-[10px] font-mono">{count}</Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 shrink-0">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function DashboardShell({ data }: { data: InnovationDashboardData }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              K
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-none">KTN</span>
              <span className="text-[10px] text-muted-foreground">Knowledge Translation Network</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <EnginePulse />
            <Link href="/dashboard">
              <Button variant="brand" size="sm">
                Open Innovation Workspace <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-border bg-gradient-to-b from-blue-950/40 via-transparent to-transparent overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-14">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>Engineering Innovation Discovery Platform</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Discover the engineering knowledge you don't yet know you have.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                KTN continuously analyzes verified engineering knowledge to surface similar problems solved
                independently, reusable solutions, cross-industry transfers, hidden relationships, recurring
                failure mechanisms, and knowledge gaps. Not a repository — an innovation engine.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link href="/dashboard">
                  <Button variant="brand" size="lg" className="h-12 px-8 text-base">
                    Enter the Innovation Workspace <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/discovery">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    Search Knowledge <Search className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.metrics.map((m) => (
              <MetricCard key={m.code} label={m.label} value={m.value} description={m.description} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">Innovation Engine recomputing continuously from</span>
            {[
              `${data.totals.knowledge} knowledge objects`,
              `${data.totals.problems} problems`,
              `${data.totals.solutions} verified solutions`,
              `${data.totals.failures} failures`,
              `${data.totals.evidence} evidence records`,
              `${data.totals.standards} standards`,
              `${data.totals.translations} translations`,
              `${data.totals.unverifiedEdges} candidate relationships`,
            ].map((item) => (
              <Badge key={item} variant="outline" className="text-[10px] font-mono">{item}</Badge>
            ))}
          </div>
        </section>

        {/* Innovation Recommendations */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <SectionHeader
            icon={<Lightbulb className="w-5 h-5" />}
            title="Innovation Opportunities"
            subtitle="Explainable, evidence-backed recommendations generated without a query."
            count={data.recommendations.length}
            href="/discovery/opportunities"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommendations.slice(0, 6).map((o) => (
              <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/opportunities" />
            ))}
          </div>
        </section>

        {/* Cross-Domain Discoveries */}
        <section className="border-t border-border bg-card/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <SectionHeader
              icon={<GitMerge className="w-5 h-5" />}
              title="Cross-Domain Discoveries"
              subtitle="Knowledge from one domain that may solve problems in another."
              count={data.crossDomainTransfers.length}
              href="/discovery/transfers"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.crossDomainTransfers.slice(0, 6).map((o) => (
                <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/transfers" />
              ))}
            </div>
          </div>
        </section>

        {/* Hidden Relationships + Similar Problems */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <SectionHeader
                icon={<Link2 className="w-5 h-5" />}
                title="Hidden Engineering Relationships"
                subtitle="Candidate relationships the graph does not yet assert. Human verification required."
                count={data.hiddenRelationships.length}
                href="/discovery/relationships"
              />
              <div className="grid grid-cols-1 gap-4">
                {data.hiddenRelationships.slice(0, 3).map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/relationships" />
                ))}
              </div>
            </div>
            <div>
              <SectionHeader
                icon={<Layers className="w-5 h-5" />}
                title="Engineering Analogies"
                subtitle="Multi-dimensional similarity beyond keywords: physics, failure, function."
                count={data.analogies.length}
                href="/discovery/analogies"
              />
              <div className="grid grid-cols-1 gap-4">
                {data.analogies.slice(0, 3).map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/analogies" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Gaps + Recurring Failures */}
        <section className="border-t border-border bg-card/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <SectionHeader
                  icon={<AlertTriangle className="w-5 h-5" />}
                  title="Knowledge Gaps"
                  subtitle="Missing knowledge the organization does not yet realize it lacks."
                  count={data.knowledgeGaps.length}
                  href="/discovery/gaps"
                />
                <div className="grid grid-cols-1 gap-4">
                  {data.knowledgeGaps.slice(0, 3).map((o) => (
                    <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/gaps" />
                  ))}
                </div>
              </div>
              <div>
                <SectionHeader
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Recurring Failure Mechanisms"
                  subtitle="Identical root mechanisms appearing across multiple domains."
                  count={data.recurringFailures.length}
                  href="/discovery/failures"
                />
                <div className="grid grid-cols-1 gap-4">
                  {data.recurringFailures.slice(0, 3).map((o) => (
                    <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/failures" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emerging Themes + Experts */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <SectionHeader
                icon={<RefreshCw className="w-5 h-5" />}
                title="Emerging Themes"
                subtitle="Physics and technology themes recurring across domains."
                count={data.emergingThemes.length}
                href="/discovery/themes"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.emergingThemes.slice(0, 6).map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} detailHref="/discovery/themes" />
                ))}
              </div>
            </div>
            <div>
              <SectionHeader
                icon={<Users className="w-5 h-5" />}
                title="Expertise Network"
                subtitle="Recommended experts for the domains above."
                count={data.experts.length}
              />
              <div className="space-y-3">
                {data.experts.slice(0, 6).map((expert) => (
                  <Card key={expert.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                        {expert.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{expert.name}</p>
                        <p className="text-[11px] text-muted-foreground">{expert.title}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[10px]">{expert.knowledgeCount} objects</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-[140px] truncate">{expert.domain}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Every Subsystem Feeds the Engine */}
        <section className="border-t border-border bg-card/30">
          <div className="max-w-7xl mx-auto px-6 py-14">
            <div className="text-center space-y-3 mb-10">
              <h2 className="text-2xl font-bold tracking-tight">Every subsystem is an input into the Innovation Engine</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Nothing was removed. Search, verification, AI, graph, analytics, ingestion, governance, evidence,
                standards, failures, and projects now continuously generate discoveries.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Search className="w-5 h-5" />, name: 'Search', role: 'Feeds similarity signals' },
                { icon: <ShieldCheck className="w-5 h-5" />, name: 'Verification', role: 'Confirms transfer candidates' },
                { icon: <Network className="w-5 h-5" />, name: 'Graph', role: 'Generates candidate edges' },
                { icon: <Database className="w-5 h-5" />, name: 'Ingestion', role: 'Expands discoverable corpus' },
                { icon: <FileCheck2 className="w-5 h-5" />, name: 'Evidence', role: 'Backs every recommendation' },
                { icon: <Boxes className="w-5 h-5" />, name: 'Standards', role: 'Links compliance context' },
                { icon: <AlertTriangle className="w-5 h-5" />, name: 'Failures', role: 'Clusters root mechanisms' },
                { icon: <Rocket className="w-5 h-5" />, name: 'Projects', role: 'Anchors reuse opportunities' },
              ].map((f) => (
                <Card key={f.name} className="p-4 text-center">
                  <div className="mx-auto mb-2 h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    {f.icon}
                  </div>
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <p className="mb-2">
          © {new Date().getFullYear()} Knowledge Translation Network (KTN). Engineering Innovation Discovery Platform.
        </p>
        <p className="text-[11px]">
          Knowledge storage is a prerequisite. Knowledge discovery is the product.
        </p>
      </footer>
    </div>
  );
}

export default async function LandingPage() {
  try {
    const data = await getInnovationDashboard();
    return <DashboardShell data={data} />;
  } catch (error) {
    console.error('Innovation dashboard failed to load:', error);
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">K</div>
              <span className="font-extrabold text-lg tracking-tight">KTN</span>
            </div>
            <Link href="/dashboard">
              <Button variant="brand" size="sm">Open Innovation Workspace <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <Card className="max-w-lg w-full p-8 text-center space-y-4">
            <Sparkles className="w-10 h-10 text-blue-400 mx-auto" />
            <h1 className="text-xl font-bold">Innovation Engine is waiting for data</h1>
            <p className="text-sm text-muted-foreground">
              The knowledge database is not reachable yet. Configure <code className="font-mono text-xs">DATABASE_URL</code>,
              run <code className="font-mono text-xs">npx prisma db push</code> and{' '}
              <code className="font-mono text-xs">npm run db:seed</code>, then reload.
            </p>
            <Link href="/dashboard" className="inline-block">
              <Button variant="outline">Try the Workspace anyway</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }
}
