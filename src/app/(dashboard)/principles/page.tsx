import React from 'react';
import { Zap, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PrinciplesCatalogPage() {
  const principles = await prisma.engineeringPrinciple.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Principles Taxonomy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Universal physical, thermal, fluid, and structural laws powering cross-domain translation
          </p>
        </div>
        <Badge variant="verified" className="w-fit text-sm px-3 py-1">
          {principles.length} Universal Principles Cataloged
        </Badge>
      </div>

      {/* Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {principles.map((p) => (
          <Card key={p.id} className="border-border hover:border-purple-500/40 transition-all shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-purple-400 border-purple-500/40 font-mono text-[10px]">
                  {p.code}
                </Badge>
                <span className="text-xs text-muted-foreground">{p.category}</span>
              </div>
              <CardTitle className="text-base font-bold">{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
