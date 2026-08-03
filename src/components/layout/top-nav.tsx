'use client';

import React, { useState } from 'react';
import { Search, Bell, LogOut, User as UserIcon, Moon, Sun, Shield } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { OrgSwitcher } from '@/components/organization/org-switcher';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface TopNavProps {
  user?: {
    fullName: string;
    email: string;
    role: string;
    organizationName?: string | null;
    isGuest?: boolean;
  };
  onOpenSearch: () => void;
}

export function TopNav({ user, onOpenSearch }: TopNavProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: `Theme updated`,
      description: `Switched to ${!isDarkMode ? 'Dark' : 'Light'} mode`,
      type: 'info',
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({
        title: 'Session reset',
        description: 'KTN continues in open guest discovery mode',
        type: 'success',
      });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'Unable to disconnect session',
        type: 'error',
      });
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Organization Switcher & Search Bar */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <OrgSwitcher currentOrgName={user?.organizationName || 'Engineering Org'} />

        <button
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-lg border border-input bg-card text-muted-foreground text-sm hover:border-primary/50 transition-colors shadow-sm"
        >
          <span className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span>Search verified solutions...</span>
          </span>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-muted text-muted-foreground border rounded">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Actions & User Menu */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
        </Button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <Avatar name={user?.fullName || 'User'} size="sm" />
            <div className="hidden md:block text-left pr-2">
              <p className="text-xs font-semibold leading-none">{user?.fullName || 'Engineer'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user?.isGuest ? 'GUEST MODE' : user?.role || 'ENGINEER'}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold">{user?.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md hover:bg-accent text-left transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md hover:bg-accent text-left transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Settings & RBAC</span>
                </button>
              </div>
              {!user?.isGuest && (
                <div className="pt-1 border-t border-border mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md text-rose-500 hover:bg-rose-500/10 text-left transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
