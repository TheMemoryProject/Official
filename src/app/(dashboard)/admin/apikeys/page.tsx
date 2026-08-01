import React from 'react';
import { Key, PlusCircle, ShieldCheck, Clock, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ApiKeysManagementPage() {
  const apiKeys = await prisma.apiKey.findMany({
    include: {
      owner: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">API Key Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision service account keys, manage OAuth2 scopes, and monitor API access audit history
          </p>
        </div>
      </div>

      {/* API Keys List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Key className="w-4 h-4 text-purple-500" />
            <span>Active Enterprise API Keys ({apiKeys.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiKeys.length > 0 ? (
            apiKeys.map((key) => (
              <div key={key.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="verified">ACTIVE</Badge>
                    <span className="font-bold text-sm">{key.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Owner: {key.owner.fullName}</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border font-mono text-xs text-muted-foreground truncate">
                  Key Hash: {key.keyHash}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Scopes: <strong className="text-purple-400">{key.scopesJson}</strong></span>
                  <span>Expires: <strong className="text-foreground">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground p-6 text-center">No active API keys provisioned.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
