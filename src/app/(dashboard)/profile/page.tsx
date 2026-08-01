import React from 'react';
import { getSession } from '@/lib/auth/session';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, Building2, Calendar, CheckCircle } from 'lucide-react';
import { canVerifySolution, canManageUsers } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) return null;

  const canVerify = canVerifySolution(session.role as any);
  const canManage = canManageUsers(session.role as any);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Engineer Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identity credentials and platform verification authorizations
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-border bg-card/60 backdrop-blur-xl shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar name={session.fullName} size="lg" className="w-20 h-20 text-2xl" />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">{session.fullName}</h2>
                <Badge
                  variant={
                    session.role === 'ADMIN'
                      ? 'admin'
                      : session.role === 'VERIFIER'
                      ? 'verified'
                      : 'secondary'
                  }
                  className="w-fit mx-auto sm:mx-0 text-sm px-3 py-1"
                >
                  {session.role}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start space-x-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>{session.email}</span>
              </p>

              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start space-x-2">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span>Organization: <strong>{session.organizationName || 'Independent Engineer'}</strong></span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RBAC Rights Matrix */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span>Assigned Security Authorizations</span>
          </CardTitle>
          <CardDescription>Role-Based Access Control matrix for active account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Solution Verification Rights</h4>
                <p className="text-xs text-muted-foreground">Audit evidence and approve solutions</p>
              </div>
              {canVerify ? (
                <Badge variant="verified">AUTHORIZED</Badge>
              ) : (
                <Badge variant="secondary">RESTRICTED</Badge>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">User & RBAC Management</h4>
                <p className="text-xs text-muted-foreground">Grant roles and organization access</p>
              </div>
              {canManage ? (
                <Badge variant="admin">AUTHORIZED</Badge>
              ) : (
                <Badge variant="secondary">RESTRICTED</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
