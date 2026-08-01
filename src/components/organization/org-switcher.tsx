'use client';

import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface OrgSwitcherProps {
  currentOrgName: string;
}

export function OrgSwitcher({ currentOrgName }: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrg, setActiveOrg] = useState(currentOrgName);
  const { toast } = useToast();

  const orgs = [
    { id: '1', name: currentOrgName || 'Primary Organization', role: 'Member' },
    { id: '2', name: 'Aerospace Engineering Div', role: 'Verifier' },
    { id: '3', name: 'Automotive Systems Lab', role: 'Contributor' },
  ];

  const handleSelect = (orgName: string) => {
    setActiveOrg(orgName);
    setIsOpen(false);
    toast({
      title: 'Organization Switched',
      description: `Active workspace: ${orgName}`,
      type: 'success',
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold shadow-sm transition-colors"
      >
        <Building2 className="w-3.5 h-3.5 text-blue-500" />
        <span className="max-w-[120px] truncate">{activeOrg}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in">
          <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
            Select Organization
          </div>
          <div className="space-y-1">
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => handleSelect(o.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div>
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-[10px] text-muted-foreground">{o.role}</p>
                </div>
                {activeOrg === o.name && <Check className="w-3.5 h-3.5 text-blue-500" />}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-border mt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                toast({
                  title: 'Create Organization',
                  description: 'Organization management interface selected',
                  type: 'info',
                });
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-blue-500 font-semibold rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
