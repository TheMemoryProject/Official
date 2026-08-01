import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404 - Node Unreachable</h1>
          <p className="text-sm text-muted-foreground">
            The requested engineering solution or platform resource could not be resolved in the KTN registry.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="brand" size="lg" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Engineering Desk
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
