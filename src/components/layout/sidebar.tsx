'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  Building2,
  User,
  Settings,
  ShieldCheck,
  Search,
  BookOpen,
  PlusCircle,
  Target,
  ShieldAlert,
  FileCheck2,
  Share2,
  Zap,
  Upload,
  Bookmark,
  Award,
  GitCommit,
  CheckSquare,
  Activity,
  Users,
  Network,
  RefreshCw,
  BarChart3,
  Lock,
  Key,
  FileText,
  Bot,
  Sparkles,
  GitBranch,
  GitPullRequest,
  Package,
  Briefcase,
  Terminal,
  Cpu,
  Store,
  FolderOpen,
  Clock,
  Radio,
  ToggleLeft,
  Server,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/lib/auth/rbac';

interface SidebarProps {
  userRole?: Role;
}

export function Sidebar({ userRole = 'ENGINEER' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'DevOps & Deployments', href: '/devops', icon: Server },
    { name: 'Environment Manager', href: '/devops/environments', icon: Globe },
    { name: 'Operations Center', href: '/operations', icon: Radio },
    { name: 'Feature Flags', href: '/operations/flags', icon: ToggleLeft },
    { name: 'Document Library', href: '/ingestion/documents', icon: FolderOpen },
    { name: 'Ingestion Wizard', href: '/ingestion/wizard', icon: Upload },
    { name: 'Queue Monitor', href: '/ingestion/queue', icon: Clock },
    { name: 'Knowledge Marketplace', href: '/marketplace', icon: Store },
    { name: 'Partner Network', href: '/marketplace/partners', icon: Building2 },
    { name: 'Governance Center', href: '/governance', icon: ShieldCheck },
    { name: 'Quality Dashboard', href: '/governance/quality', icon: Award },
    { name: 'Integrity Scanner', href: '/governance/integrity', icon: ShieldAlert },
    { name: 'AI Engineering Workspace', href: '/assistant', icon: Bot },
    { name: 'Executive Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Developer Portal', href: '/developer', icon: Terminal },
    { name: 'Automation Engine', href: '/developer/automation', icon: Zap },
    { name: 'GraphQL Explorer', href: '/developer/graphql', icon: Cpu },
    { name: 'Projects & Portfolios', href: '/projects', icon: Briefcase },
    { name: 'Solution Discovery', href: '/discovery', icon: Search },
    { name: 'Version Control', href: '/versions/history', icon: GitBranch },
    { name: 'Change Requests (ECR)', href: '/versions/requests', icon: GitPullRequest },
    { name: 'Release Manager', href: '/versions/releases', icon: Package },
    { name: 'Search Analytics', href: '/search/analytics', icon: Activity },
    { name: 'Submit Knowledge', href: '/knowledge/new', icon: PlusCircle },
    { name: 'Integration Center', href: '/integrations', icon: Network },
    { name: 'Sync Jobs Monitor', href: '/integrations/jobs', icon: RefreshCw },
    { name: 'Decision Workspace', href: '/decisions', icon: GitCommit },
    { name: 'Task Board', href: '/tasks', icon: CheckSquare },
    { name: 'Activity Feed', href: '/activity', icon: Activity },
    { name: 'Team Collaboration', href: '/collaboration', icon: Users },
    { name: 'Standards & Compliance', href: '/standards', icon: Award },
    { name: 'Problem Matcher', href: '/matcher', icon: Target },
    { name: 'Failure Library', href: '/failures', icon: ShieldAlert },
    { name: 'Evidence & Traceability', href: '/evidence', icon: FileCheck2 },
    { name: 'Knowledge Graph', href: '/graph', icon: Share2 },
    { name: 'Translation Engine', href: '/translation/workspace', icon: Zap },
    { name: 'Organization', href: '/dashboard#organization', icon: Building2 },
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg font-black text-xl">
          K
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-base flex items-center gap-1.5">
            KTN
            <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">Knowledge Translation</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Active Role</span>
        <Badge
          variant={
            userRole === 'ADMIN'
              ? 'admin'
              : userRole === 'VERIFIER'
              ? 'verified'
              : 'secondary'
          }
        >
          {userRole}
        </Badge>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Enterprise Admin Controls */}
        {userRole === 'ADMIN' && (
          <div className="pb-3 border-b border-border mb-3">
            <div className="px-3 pb-2 text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-3 h-3" />
              <span>Admin Console</span>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                pathname === '/admin'
                  ? 'bg-amber-500/20 text-amber-400 font-bold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Security Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                pathname === '/admin/users'
                  ? 'bg-amber-500/20 text-amber-400 font-bold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>User Administration</span>
            </Link>
            <Link
              href="/admin/apikeys"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                pathname === '/admin/apikeys'
                  ? 'bg-amber-500/20 text-amber-400 font-bold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Key className="w-4 h-4 text-purple-500" />
              <span>API Key Credentials</span>
            </Link>
            <Link
              href="/admin/audit"
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                pathname === '/admin/audit'
                  ? 'bg-amber-500/20 text-amber-400 font-bold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Security Audit Logs</span>
            </Link>
          </div>
        )}

        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Platform Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Verification Queue (Verifiers & Admins) */}
        {(userRole === 'ADMIN' || userRole === 'VERIFIER') && (
          <div className="pt-3 border-t border-border mt-3">
            <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Verification Desk
            </div>
            <Link
              href="/verification"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Review Queue</span>
              </div>
              <span className="text-xs font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
                Queue Active
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-card/40 text-xs text-muted-foreground flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Knowledge Network Active</span>
        </span>
      </div>
    </aside>
  );
}
