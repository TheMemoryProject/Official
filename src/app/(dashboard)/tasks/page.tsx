import React from 'react';
import { CheckSquare, PlusCircle, Clock, User, ArrowRight, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TasksKanbanPage() {
  const tasks = await prisma.engineeringTask.findMany({
    include: {
      assignee: { select: { fullName: true } },
      reporter: { select: { fullName: true } },
      decision: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const reviewTasks = tasks.filter((t) => t.status === 'TECHNICAL_REVIEW');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engineering Task Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban workflow tracking engineering tasks, verification requests, and decision audit items
          </p>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Column 1: TODO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Do ({todoTasks.length})</span>
          </div>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <Card key={task.id} className="border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">{task.priority}</Badge>
                  <span className="text-[11px] text-muted-foreground">{task.assignee?.fullName || 'Unassigned'}</span>
                </div>
                <h4 className="font-bold text-sm">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-blue-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">In Progress ({inProgressTasks.length})</span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <Card key={task.id} className="border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="verified" className="text-[10px]">{task.priority}</Badge>
                  <span className="text-[11px] text-muted-foreground">{task.assignee?.fullName}</span>
                </div>
                <h4 className="font-bold text-sm text-foreground">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 3: TECHNICAL REVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-purple-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Technical Review ({reviewTasks.length})</span>
          </div>
          <div className="space-y-3">
            {reviewTasks.map((task) => (
              <Card key={task.id} className="border-purple-500/30 bg-purple-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/40">{task.priority}</Badge>
                </div>
                <h4 className="font-bold text-sm">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 4: DONE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-emerald-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Done ({doneTasks.length})</span>
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <Card key={task.id} className="border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <Badge variant="verified" className="text-[10px]">COMPLETED</Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground line-through">{task.title}</h4>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
