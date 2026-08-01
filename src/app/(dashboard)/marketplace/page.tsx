import React from 'react';
import { Store, Download, Building2, ShieldCheck, CheckCircle2, Search, ArrowRight, Globe, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function KnowledgeMarketplacePage() {
  const [listings, consortiums] = await Promise.all([
    prisma.marketplaceListing.findMany({
      include: {
        publisherOrg: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.engineeringConsortium.findMany({
      include: {
        leadOrg: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-400 mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>Federated Knowledge Exchange & Marketplace</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Knowledge Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover, license, and import peer-reviewed engineering knowledge, evidence packages, and standards mappings from trusted partner organizations
          </p>
        </div>
        <Link href="/marketplace/partners">
          <Button variant="outline" size="sm" className="text-xs">
            <Building2 className="w-3.5 h-3.5 mr-1.5" /> Manage Partners & Consortiums
          </Button>
        </Link>
      </div>

      {/* Consortium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {consortiums.map((c) => (
          <Card key={c.id} className="border-border p-6 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <Badge variant="verified" className="text-[10px]">CONSORTIUM</Badge>
              <span className="text-xs font-mono text-muted-foreground">Lead: {c.leadOrg.name}</span>
            </div>
            <h3 className="font-bold text-lg">{c.name}</h3>
            <p className="text-xs text-muted-foreground">{c.description}</p>
          </Card>
        ))}
      </div>

      {/* Published Marketplace Listings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Verified Engineering Listings ({listings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listings.length > 0 ? (
            listings.map((item) => (
              <div key={item.id} className="p-5 rounded-xl border border-border bg-card/60 space-y-3 hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/40 text-indigo-400">
                      LICENSE: {item.licenseType}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{item.visibilityScope}</Badge>
                    <span className="font-bold text-base">{item.title}</span>
                  </div>
                  <Badge variant="verified">{item.verificationStatus}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">{item.summary}</p>

                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border pt-3">
                  <span>Publisher: <strong className="text-foreground">{item.publisherOrg.name}</strong> • Imports: {item.downloadCount}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400">
                    Import to Workspace <Download className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No marketplace listings available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
