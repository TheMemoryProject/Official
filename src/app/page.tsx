import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck2,
  Building2,
  ArrowRight,
  Database,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              K
            </div>
            <span className="font-extrabold text-lg tracking-tight">KTN</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="brand" size="sm">
                Access Platform
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Verification-First Engineering Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Structured, Verified Engineering Knowledge created by Humans.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover proven, peer-verified engineering solutions across industries. Linked to evidence, known limitations, failure modes, and domain taxonomies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button variant="brand" size="lg" className="h-12 px-8 text-base">
                Explore Knowledge Network <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Verify Solution Evidence
              </Button>
            </Link>
          </div>

          {/* Quick Search Preview */}
          <div className="pt-10 max-w-2xl mx-auto">
            <div className="p-3 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl flex items-center space-x-3">
              <Search className="w-5 h-5 text-muted-foreground ml-2" />
              <input
                type="text"
                readOnly
                placeholder="Search across 10,000+ verified engineering solutions..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-muted-foreground cursor-pointer"
              />
              <Badge variant="verified">100% Peer Verified</Badge>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-t border-border bg-card/30 px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Core Architecture Pillars</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built specifically for engineers who require empirical verification over AI hallucinations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <FileCheck2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <CardTitle>Strict Verification Workflows</CardTitle>
                  <CardDescription>
                    Every solution undergoes rigorous multi-tier verification by designated domain verifiers prior to indexing.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <Database className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>Empirical Evidence Linking</CardTitle>
                  <CardDescription>
                    Solutions are bound to empirical test data, failure analysis logs, CAD benchmarks, and validated code.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <Lock className="w-10 h-10 text-purple-500 mb-2" />
                  <CardTitle>Enterprise RBAC Security</CardTitle>
                  <CardDescription>
                    Granular role-based access control protecting organization knowledge graphs and sensitive engineering parameters.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Verified Solutions Showcase */}
        <section className="py-20 px-6 max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Recent Verified Knowledge</h3>
              <p className="text-sm text-muted-foreground">Solutions validated with empirical test evidence</p>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="verified">VERIFIED SOLUTION</Badge>
                <span className="text-xs text-muted-foreground font-mono">Aerospace Domain</span>
              </div>
              <h4 className="font-bold text-lg">Thermal Barrier Coating Degradation Mitigations</h4>
              <p className="text-sm text-muted-foreground">
                Verified protocol for ceramic matrix composite thermal endurance under high-velocity combustion cycles.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-emerald-500/20">
                <span>Verifier: Senior Propulsion Lead</span>
                <span>Evidence: 12 Test Runs</span>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="verified">VERIFIED SOLUTION</Badge>
                <span className="text-xs text-muted-foreground font-mono">Software Infrastructure</span>
              </div>
              <h4 className="font-bold text-lg">Distributed Consensus Deadlock Resolution</h4>
              <p className="text-sm text-muted-foreground">
                Raft protocol edge-case mitigation strategy for high-latency inter-datacenter partition recovery.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-blue-500/20">
                <span>Verifier: Systems Architect</span>
                <span>Evidence: Benchmark Logs</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Knowledge Translation Network (KTN). Verification-First Engineering Platform.</p>
      </footer>
    </div>
  );
}
