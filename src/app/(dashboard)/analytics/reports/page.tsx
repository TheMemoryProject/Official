'use client';

import React, { useState } from 'react';
import { Download, FileText, PlusCircle, CheckCircle2, BarChart3, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function CustomReportsPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,MetricCode,MetricName,Value,Timestamp\nKNOWLEDGE_REUSE_RATE,Cross-Industry Knowledge Reuse Rate,34.2,2026-07-31\nVERIFICATION_THROUGHPUT,Verification Desk Throughput,1.8,2026-07-31\nENGINEERING_HEALTH,Executive Health Score,88,2026-07-31";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "ktn_executive_analytics_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
      toast({ title: 'Report Export Complete', description: 'Downloaded CSV executive analytics report', type: 'success' });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Custom Report Builder & Export Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom analytical reports, schedule automated exports, and generate audit-compliant PDF/CSV summaries
          </p>
        </div>
        <Button variant="brand" onClick={handleExportCSV} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Generating Report...' : 'Export Executive CSV'}
        </Button>
      </div>

      {/* Pre-configured Report Templates */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Pre-Configured Executive Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
            <div>
              <Badge variant="verified" className="text-[10px] mb-1">EXECUTIVE SUMMARY</Badge>
              <h4 className="font-bold text-sm">Executive Engineering Health & Compliance Audit</h4>
              <p className="text-xs text-muted-foreground">Comprehensive evaluation of knowledge assets, verification rates, and standard compliance.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between">
            <div>
              <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/40 mb-1">KNOWLEDGE GAPS</Badge>
              <h4 className="font-bold text-sm">Cross-Domain Knowledge Gap Matrix</h4>
              <p className="text-xs text-muted-foreground">Identifies domains requiring additional empirical evidence and verification.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
