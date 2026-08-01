import React from 'react';
import { Terminal, Code, Cpu, Download, FileText, CheckCircle2, ShieldCheck, ExternalLink, Zap, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DeveloperPortalPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Programmable Knowledge Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Developer Portal & API Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Programmatically integrate KTN into engineering workflows, CI/CD pipelines, and enterprise CAD/PLM systems
          </p>
        </div>
      </div>

      {/* Quick API Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border p-6 space-y-3 bg-card hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <Code className="w-5 h-5 text-purple-400" />
            <Badge variant="verified" className="text-[10px]">REST v1</Badge>
          </div>
          <h3 className="font-bold text-lg">REST API v1</h3>
          <p className="text-xs text-muted-foreground">OpenAPI 3.1 compliant endpoints for deterministic search, knowledge, and standards.</p>
          <div className="pt-2">
            <Link href="/api/v1/openapi.json" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View OpenAPI Spec <ExternalLink className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border-border p-6 space-y-3 bg-card hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <Cpu className="w-5 h-5 text-blue-400" />
            <Badge variant="secondary" className="text-[10px]">GraphQL</Badge>
          </div>
          <h3 className="font-bold text-lg">GraphQL Gateway</h3>
          <p className="text-xs text-muted-foreground">Unified GraphQL schema supporting field selection, nested relations, and mutations.</p>
          <div className="pt-2">
            <Link href="/developer/graphql">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Launch Explorer <Terminal className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="border-border p-6 space-y-3 bg-card hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <Zap className="w-5 h-5 text-amber-400" />
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">Rules Engine</Badge>
          </div>
          <h3 className="font-bold text-lg">Automation Engine</h3>
          <p className="text-xs text-muted-foreground">Configure IF-THEN event triggers to notify managers, create tasks, and sync webhooks.</p>
          <div className="pt-2">
            <Link href="/developer/automation">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Rule Builder <Zap className="w-3 h-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Official SDK Downloads */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Download className="w-4 h-4 text-purple-400" />
            <span>Official Client SDKs</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Download typed client SDKs built for enterprise stability, automatic retries, and streaming
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="font-mono font-bold text-xs text-purple-400">@ktn/sdk-ts</span>
            <p className="text-[11px] text-muted-foreground">TypeScript / Node.js client library with full Zod types.</p>
            <Badge variant="secondary" className="text-[9px]">v1.4.2</Badge>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="font-mono font-bold text-xs text-blue-400">ktn-python</span>
            <p className="text-[11px] text-muted-foreground">Python SDK for engineering data analysis & notebooks.</p>
            <Badge variant="secondary" className="text-[9px]">v1.2.0</Badge>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="font-mono font-bold text-xs text-emerald-400">ktn-go</span>
            <p className="text-[11px] text-muted-foreground">High-throughput Go client for CLI microservices.</p>
            <Badge variant="secondary" className="text-[9px]">v1.0.1</Badge>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="font-mono font-bold text-xs text-amber-400">ktn-java</span>
            <p className="text-[11px] text-muted-foreground">Enterprise Java SDK for PLM/ERP integration jobs.</p>
            <Badge variant="secondary" className="text-[9px]">v1.1.0</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
