import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

const createTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  decisionId: z.string().uuid().optional(),
  knowledgeEntryId: z.string().uuid().optional(),
  failureRecordId: z.string().uuid().optional(),
  standardId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status) whereClause.status = status as TaskStatus;

    const tasks = await prisma.engineeringTask.findMany({
      where: whereClause,
      include: {
        assignee: { select: { fullName: true, title: true } },
        reporter: { select: { fullName: true } },
        decision: { select: { title: true } },
        knowledgeEntry: { select: { title: true } },
        failureRecord: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching engineering tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch engineering tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const task = await prisma.engineeringTask.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        reporterId: session.id,
        organizationId: session.organizationId,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        actionType: 'TASK_CREATED',
        targetType: 'TASK',
        targetId: task.id,
        summary: `Created Engineering Task: ${task.title}`,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating engineering task:', error);
    return NextResponse.json({ error: 'Failed to create engineering task' }, { status: 500 });
  }
}
