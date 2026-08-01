'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    toast({
      title: 'Reset Link Transmitted',
      description: `Security instructions dispatched to ${email}`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
            K
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Password Recovery</h1>
          <p className="text-sm text-muted-foreground">Restore credentials to KTN verification node</p>
        </div>

        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          {sent ? (
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Check your inbox</h3>
              <p className="text-xs text-muted-foreground">
                Recovery token transmitted to <strong>{email}</strong>. Follow the encrypted link to reset your key.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl">Request Reset</CardTitle>
                <CardDescription>Enter registered email to receive authentication link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Registered Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button variant="brand" className="w-full h-11 text-base font-semibold">
                  Send Recovery Link
                </Button>
                <Link href="/login" className="text-xs text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
