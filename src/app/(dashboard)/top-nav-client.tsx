'use client';

import React, { useState } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { GlobalSearch } from '@/components/layout/global-search';

export function TopNavClient({ user }: { user: any }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <TopNav user={user} onOpenSearch={() => setSearchOpen(true)} />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
