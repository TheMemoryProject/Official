import React from 'react';
import { Users, PlusCircle, ShieldCheck, UserCheck, Mail, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Administration & RBAC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision users, assign system roles (Admin, Verifier, Engineer, Viewer), and manage organization access
          </p>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Provisioned Organization Users ({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant={user.role === 'ADMIN' ? 'admin' : user.role === 'VERIFIER' ? 'verified' : 'secondary'}>
                    {user.role}
                  </Badge>
                  <span className="font-bold text-sm">{user.fullName}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{user.email} • {user.title || 'Specialist'}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{user.organization?.name || 'Global'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
