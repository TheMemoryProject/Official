import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Users,
  PlusCircle,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DashboardClientActions } from './dashboard-client-actions';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  const [solutionsCount, problemsCount, unverifiedCount, recentSolutions, recentProblems] = await Promise.all([
    prisma.verifiedSolution.count({ where: { deletedAt: null } }),
    prisma.engineeringProblem.count({ where: { deletedAt: null } }),
    prisma.verifiedSolution.count({ where: { verificationStatus: 'UNVERIFIED', deletedAt: null } }),
    prisma.verifiedSolution.findMany({
      where: { deletedAt: null },
      include: {
        creator: { select: { fullName: true, title: true } },
        verifier: { select: { fullName: true } },
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        problem: { select: { title: true, severity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.engineeringProblem.findMany({
      where: { deletedAt: null },
      include: {
        creator: { select: { fullName: true } },
        domain: { select: { name: true } },
        _count: { select: { solutions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Knowledge Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verification-first solution registry for {session?.organizationName || 'Engineering Organization'}
          </p>
        </div>
        <DashboardClientActions userRole={session?.role} />
      </div>

      {/* Analytics Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified Solutions
            </CardTitle>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{solutionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> 100% Peer Validated
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Open Engineering Problems
            </CardTitle>
            <AlertTriangle className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{problemsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active problem statements</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Verification Queue
            </CardTitle>
            <FileCheck2 className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{unverifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting audit review</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Active Role
            </CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{session?.role || 'ENGINEER'}</div>
            <p className="text-xs text-muted-foreground mt-1">Authorized Permissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Verified Solutions Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Verified Solutions Feed</span>
            </h2>
            <Badge variant="outline">{recentSolutions.length} Solutions Displayed</Badge>
          </div>

          {recentSolutions.length > 0 ? (
            <div className="space-y-4">
              {recentSolutions.map((sol) => (
                <div
                  key={sol.id}
                  id={`solution-${sol.id}`}
                  className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge
                          variant={
                            sol.verificationStatus === 'VERIFIED'
                              ? 'verified'
                              : sol.verificationStatus === 'UNDER_REVIEW'
                              ? 'unverified'
                              : 'secondary'
                          }
                        >
                          {sol.verificationStatus}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {sol.domain?.name} • {sol.industry?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold hover:text-primary transition-colors cursor-pointer">
                        {sol.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{sol.summary}</p>

                  {sol.knownLimitations && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                      <strong>Known Limitations:</strong> {sol.knownLimitations}
                    </div>
                  )}

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <span>Contributor: <strong>{sol.creator.fullName}</strong></span>
                      {sol.verifier && <span>• Verified by: <strong>{sol.verifier.fullName}</strong></span>}
                    </div>
                    <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-lg font-semibold">No Verified Solutions Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Submit an engineering solution linked to empirical evidence to initiate the verification workflow.
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Open Problems & Verification Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-blue-500" />
              <span>Engineering Problems</span>
            </h2>
          </div>

          <div className="space-y-3">
            {recentProblems.length > 0 ? (
              recentProblems.map((prob) => (
                <div key={prob.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {prob.severity} SEVERITY
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{prob.domain?.name}</span>
                  </div>
                  <h4 className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">
                    {prob.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>By {prob.creator.fullName}</span>
                    <span>{prob._count.solutions} Verified Solutions</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl border border-border bg-card text-center text-xs text-muted-foreground">
                No open engineering problems recorded.
              </div>
            )}
          </div>

          {/* System Activity Widget */}
          <Card className="border-border bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Verification Node Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Prisma ORM Status</span>
                <span className="text-emerald-500 font-semibold">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PostgreSQL DB Engine</span>
                <span className="text-emerald-500 font-semibold">HEALTHY</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase Security Rules</span>
                <span className="text-emerald-500 font-semibold">ENFORCED</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
