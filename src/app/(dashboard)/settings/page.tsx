'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, Key, Moon, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('ktn_live_sec_994827491029');

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your platform configuration preferences have been updated.',
      type: 'success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">System & Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure security, notifications, and integration settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Security & API Key */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-500" />
              <span>API Integration Token</span>
            </CardTitle>
            <CardDescription>Use this key to programmatically query verified engineering knowledge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Secret Token</Label>
              <div className="flex space-x-3">
                <Input value={apiKey} readOnly className="font-mono text-xs bg-muted" />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast({ title: 'Copied', description: 'API Token copied to clipboard', type: 'info' });
                  }}
                >
                  Copy Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-500" />
              <span>Verification Alerts</span>
            </CardTitle>
            <CardDescription>Receive real-time alerts when solutions in your domain are verified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/40">
              <div>
                <h4 className="text-sm font-semibold">Email Notifications</h4>
                <p className="text-xs text-muted-foreground">Alert when solutions require verification audit</p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-input text-blue-600 focus:ring-blue-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="brand" onClick={handleSave}>
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
