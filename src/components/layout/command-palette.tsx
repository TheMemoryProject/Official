'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  PlusCircle,
  ShieldCheck,
  BarChart3,
  Bot,
  Terminal,
  Store,
  FolderOpen,
  Radio,
  Briefcase,
  GitBranch,
  Target,
  ShieldAlert,
  FileCheck2,
  Share2,
  Zap,
  Building2,
  User,
  Settings,
  X,
  Keyboard,
} from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const commands: CommandItem[] = [
    { id: 'dashboard', name: 'Dashboard', category: 'Navigation', href: '/dashboard', icon: LayoutDashboardIcon },
    { id: 'discovery', name: 'Solution Discovery Search', category: 'Navigation', href: '/discovery', icon: Search },
    { id: 'assistant', name: 'AI Engineering Workspace', category: 'AI Assistant', href: '/assistant', icon: Bot },
    { id: 'analytics', name: 'Executive Analytics', category: 'Analytics', href: '/analytics', icon: BarChart3 },
    { id: 'knowledge-new', name: 'Submit Knowledge Entry', category: 'Actions', href: '/knowledge/new', icon: PlusCircle },
    { id: 'operations', name: 'Admin Operations Center', category: 'Operations', href: '/operations', icon: Radio },
    { id: 'devops', name: 'DevOps & Deployments', category: 'Operations', href: '/devops', icon: Terminal },
    { id: 'documents', name: 'Document Library & Parser', category: 'Ingestion', href: '/ingestion/documents', icon: FolderOpen },
    { id: 'marketplace', name: 'Knowledge Marketplace', category: 'Federation', href: '/marketplace', icon: Store },
    { id: 'governance', name: 'Governance Center', category: 'Governance', href: '/governance', icon: ShieldCheck },
    { id: 'projects', name: 'Projects & Portfolios', category: 'Workspace', href: '/projects', icon: Briefcase },
    { id: 'failures', name: 'Failure Library & FMEA', category: 'Engineering', href: '/failures', icon: ShieldAlert },
    { id: 'evidence', name: 'Evidence & Traceability', category: 'Engineering', href: '/evidence', icon: FileCheck2 },
    { id: 'standards', name: 'Standards & Compliance', category: 'Compliance', href: '/standards', icon: BookOpen },
    { id: 'graph', name: 'Knowledge Graph & Pathfinder', category: 'Engineering', href: '/graph', icon: Share2 },
    { id: 'matcher', name: '9-D Problem Matcher', category: 'Engineering', href: '/matcher', icon: Target },
    { id: 'translation', name: 'Cross-Domain Translation Engine', category: 'Engineering', href: '/translation/workspace', icon: Zap },
    { id: 'settings', name: 'Settings & Profile', category: 'Account', href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-0"
        role="dialog"
        aria-modal="true"
        aria-label="Universal Command Palette"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Type a command or search (e.g. Failure Library, AI Assistant, Standards)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-muted/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">{cmd.name}</span>
                      <span className="text-[10px] text-muted-foreground">{cmd.category}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-muted/40 px-2 py-0.5 rounded text-muted-foreground group-hover:text-foreground">
                    Jump to
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Keyboard className="w-3 h-3" /> Navigation: Use <kbd className="bg-muted px-1 rounded">↑</kbd> <kbd className="bg-muted px-1 rounded">↓</kbd> to navigate
          </span>
          <span>Press <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}
