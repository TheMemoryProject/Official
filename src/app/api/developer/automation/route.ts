import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createRuleSchema = z.object({
  name: z.string().min(3),
  triggerEvent: z.string().min(3),
  conditionsJson: z.string().default('[]'),
  actionsJson: z.string().default('[]'),
});

export async function GET() {
  try {
    const rules = await prisma.automationRule.findMany({
      include: {
        runLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const data = createRuleSchema.parse(body);

    const rule = await prisma.automationRule.create({
      data: {
        name: data.name,
        triggerEvent: data.triggerEvent,
        conditionsJson: data.conditionsJson,
        actionsJson: data.actionsJson,
        organizationId: session.organizationId || '00000000-0000-0000-0000-000000000000',
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating automation rule:', error);
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 });
  }
}
