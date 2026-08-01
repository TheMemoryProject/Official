import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createIncidentSchema = z.object({
  title: z.string().min(5),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MINOR'),
  affectedService: z.string().min(2),
  rootCause: z.string().optional(),
});

export async function GET() {
  try {
    const incidents = await prisma.systemIncident.findMany({
      include: {
        owner: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createIncidentSchema.parse(body);

    const incident = await prisma.systemIncident.create({
      data: {
        title: data.title,
        severity: data.severity,
        affectedService: data.affectedService,
        rootCause: data.rootCause,
        status: 'INVESTIGATING',
        ownerId: session.id,
      },
    });

    return NextResponse.json({ success: true, incident });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Failed to log incident' }, { status: 500 });
  }
}
