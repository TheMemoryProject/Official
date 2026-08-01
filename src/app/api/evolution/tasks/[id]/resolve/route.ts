import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { resolveRevalidationTask } from '@/lib/evolution/service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const resolveSchema = z.object({
  status: z.enum([
    'RESOLVED_CONFIRMED',
    'RESOLVED_AMENDED',
    'RESOLVED_RETIRED',
    'DISMISSED',
  ]),
  rationale: z
    .string()
    .min(10, 'A resolution rationale of at least 10 characters is required. An unexplained resolution is not an audit trail.'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const data = resolveSchema.parse(await request.json());

    const task = await prisma.revalidationTask.findUnique({
      where: { id },
      include: { knowledge: { select: { creatorId: true } } },
    });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Separation of duties: revalidation is a verification act, so the author of the
    // knowledge cannot clear the flag on their own work.
    if (task.knowledge.creatorId === session.id) {
      return NextResponse.json(
        {
          error:
            'You authored this knowledge and cannot resolve its own revalidation. Assign it to another verifier.',
        },
        { status: 403 }
      );
    }

    const result = await resolveRevalidationTask(prisma, id, {
      status: data.status,
      resolvedById: session.id,
      rationale: data.rationale,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && /already resolved/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Revalidation resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve revalidation task' }, { status: 500 });
  }
}
