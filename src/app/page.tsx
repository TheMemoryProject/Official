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
import { loadLedger, summarise } from '@/lib/capabilities/ledger';

/**
 * The public landing page reads the Capability Ledger at build time.
 *
 * This is deliberate: it makes it structurally impossible for the marketing surface to
 * claim a capability the ledger does not support. Nothing on this page is a hand-written
 * count, and there are no illustrative "sample" records — a page about verified
 * engineering knowledge must not itself contain invented engineering records.
 */
export default function LandingPage() {
  const ledger = loadLedger();
  const counts = summarise(ledger);

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
            An engineering knowledge system built so that a conclusion carries its evidence,
            its validity range, and the date it stops being trustworthy. Scores are computed
            deterministically, never generated. When the evidence is not there, it says so.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full">
            <span>
              Pre-release. {counts.REAL} of {counts.total} capabilities are independently
              test-verified — see the public ledger below.
            </span>
          </div>

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
                placeholder="Search verified engineering knowledge..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-muted-foreground cursor-pointer"
              />
              <Badge variant="outline">Sign in to search</Badge>
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
                  <CardTitle>Knowledge That Expires</CardTitle>
                  <CardDescription>
                    A conclusion depends on the standards, materials, processes and evidence
                    that held when it was verified. When any of those change, every dependent
                    conclusion is traced and flagged for re-verification — with an immutable
                    record of why.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <Database className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>Computed, Not Generated</CardTitle>
                  <CardDescription>
                    Trust and currency scores come from pure, versioned functions over typed
                    evidence. No language model touches a score. Every number ships with the
                    full derivation that produced it, and recomputation must reproduce it exactly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <Lock className="w-10 h-10 text-purple-500 mb-2" />
                  <CardTitle>Fails Closed</CardTitle>
                  <CardDescription>
                    On missing evidence or an unmet precondition the system abstains rather
                    than guessing. An author cannot verify their own claim. Empty input never
                    produces a passing score.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Capability Ledger — the honest status of this build */}
        <section className="py-20 px-6 max-w-6xl mx-auto space-y-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">What actually works today</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mt-1">
              Most platforms show you a feature list. This one publishes its Capability
              Ledger, where a feature may only be called verified if a test exercises it end
              to end against a real database. A build-time test fails the release if this page
              claims otherwise.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'REAL', label: 'Verified', tone: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
              { key: 'PARTIAL', label: 'Partial', tone: 'border-amber-500/20 bg-amber-500/5 text-amber-400' },
              { key: 'SHELL', label: 'Shell', tone: 'border-rose-500/20 bg-rose-500/5 text-rose-400' },
              { key: 'ABSENT', label: 'Not built', tone: 'border-border bg-card/50 text-muted-foreground' },
            ].map((s) => (
              <div key={s.key} className={`p-5 rounded-xl border ${s.tone}`}>
                <div className="text-3xl font-extrabold">
                  {counts[s.key as 'REAL' | 'PARTIAL' | 'SHELL' | 'ABSENT']}
                </div>
                <div className="text-xs font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {ledger.capabilities
              .filter((c) => c.status === 'REAL')
              .map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm">{c.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.id}</p>
                  </div>
                  <Badge variant="verified" className="shrink-0">
                    TEST-VERIFIED
                  </Badge>
                </div>
              ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Ledger version {ledger.ledgerVersion}, generated {ledger.generatedAt} from commit{' '}
            <code className="font-mono">{ledger.commitAudited}</code>. Everything not listed
            above is partial, a shell, or not yet built, and is recorded as such rather than
            implied.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Knowledge Translation Network (KTN). Verification-First Engineering Platform.</p>
      </footer>
    </div>
  );
}
