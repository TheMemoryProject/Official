'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network, PlusCircle, Save, Database, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewConnectorPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [connectorType, setConnectorType] = useState('PLM_WINDCHILL');
  const [baseUrl, setBaseUrl] = useState('');
  const [authMethod, setAuthMethod] = useState('OAUTH2');
  const [syncDirection, setSyncDirection] = useState('INBOUND');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: 'Validation Error', description: 'Connector name is required', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/integrations/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          connectorType,
          baseUrl: baseUrl || undefined,
          authMethod,
          syncDirection,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to configure connector');

      toast({ title: 'Enterprise Connector Registered', description: 'Connector added to active integration matrix', type: 'success' });
      router.push('/integrations');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Configuration Error', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-500">Configure Enterprise Connector</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register external PLM, ERP, QMS, CAD, or Git repository endpoints for synchronization
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Connector Settings & Endpoints</CardTitle>
            <CardDescription>Specify authentication protocol and sync parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connector System Name *</Label>
              <Input
                id="name"
                placeholder="e.g. PTC Windchill Enterprise PLM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connectorType">System Type *</Label>
                <select
                  id="connectorType"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                >
                  <option value="PLM_WINDCHILL">PTC Windchill PLM</option>
                  <option value="PLM_TEAMCENTER">Siemens Teamcenter PLM</option>
                  <option value="ERP_SAP">SAP S/4HANA ERP</option>
                  <option value="QMS_TRACKWISE">TrackWise QMS</option>
                  <option value="GIT_GITHUB">GitHub Enterprise</option>
                  <option value="REST_API">Generic REST API</option>
                  <option value="WEBHOOK">Webhook Listener</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncDirection">Synchronization Direction</Label>
                <select
                  id="syncDirection"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={syncDirection}
                  onChange={(e) => setSyncDirection(e.target.value)}
                >
                  <option value="INBOUND">Inbound (External ➔ KTN)</option>
                  <option value="OUTBOUND">Outbound (KTN ➔ External)</option>
                  <option value="BIDIRECTIONAL">Bidirectional Sync</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base API Endpoint / URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://plm.apex-labs.internal/Windchill"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authMethod">Authentication Protocol</Label>
              <select
                id="authMethod"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
              >
                <option value="OAUTH2">OAuth 2.0 Client Credentials</option>
                <option value="API_KEY">API Key Token</option>
                <option value="BASIC">Basic Auth (Username / Password)</option>
                <option value="MUTUAL_TLS">mTLS (Mutual Certificate TLS)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? 'Saving Connector...' : 'Register Connector'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
