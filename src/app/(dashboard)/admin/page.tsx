import React from 'react';
import { ShieldCheck, Users, Key, FileText, Lock, Building2, Activity, ArrowRight, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminConsolePage() {
  const [userCount, apiKeyCount, auditCount, orgCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.apiKey.count(),
    prisma.securityAuditLog.count(),
    prisma.organization.count(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Security & Multi-Tenant Control Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Administration Console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage multi-tenant organization boundaries, user RBAC roles, API key provisioning, and immutable security audit logs
          </p>
        </div>
      </div>

      {/* Admin Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Provisioned Users</span>
          <span className="text-3xl font-extrabold text-blue-500 mt-2 block">{userCount} Users</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Active API Keys</span>
          <span className="text-3xl font-extrabold text-purple-500 mt-2 block">{apiKeyCount} Keys</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Audit Events Recorded</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">{auditCount} Events</span>
        </Card>

        <Card className="border-border p-6 bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Active Tenant Orgs</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-2 block">{orgCount} Tenants</span>
        </Card>
      </div>

      {/* Navigation Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border hover:border-blue-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>User Administration</span>
            </h3>
            <Badge variant="secondary" className="text-[10px]">{userCount} Users</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Manage user provisioning, RBAC role assignment, and organization memberships.</p>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-blue-400">
              Manage Users & Roles <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="border-border hover:border-purple-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Key className="w-4 h-4 text-purple-500" />
              <span>API Key Credentials</span>
            </h3>
            <Badge variant="secondary" className="text-[10px]">{apiKeyCount} Keys</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Provision service accounts, rotate API secrets, and configure granular key scopes.</p>
          <Link href="/admin/apikeys">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-purple-400">
              Manage API Keys <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="border-border hover:border-emerald-500/40 transition-all p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Security Audit Logs</span>
            </h3>
            <Badge variant="verified" className="text-[10px]">IMMUTABLE</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Explore tamper-proof audit trails of administrative events, permission edits, and logins.</p>
          <Link href="/admin/audit">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-emerald-400">
              Explore Audit Logs <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
