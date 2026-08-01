import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createECRSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  reasonForChange: z.string().min(5),
  riskLevel: z.string().default('LOW'),
  affectedKnowledgeId: z.string().optional(),
});

export async function GET() {
  try {
    const changeRequests = await prisma.knowledgeChangeRequest.findMany({
      include: {
        requester: { select: { fullName: true, email: true } },
        affectedKnowledge: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ changeRequests });
  } catch (error) {
    console.error('Error fetching change requests:', error);
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createECRSchema.parse(body);

    const ecrCount = await prisma.knowledgeChangeRequest.count();
    const ecrNumber = `ECR-2026-${String(ecrCount + 1).padStart(3, '0')}`;

    const ecr = await prisma.knowledgeChangeRequest.create({
      data: {
        ecrNumber,
        title: data.title,
        description: data.description,
        reasonForChange: data.reasonForChange,
        riskLevel: data.riskLevel,
        affectedKnowledgeId: data.affectedKnowledgeId,
        requesterId: session.id,
      },
    });

    return NextResponse.json({ success: true, changeRequest: ecr });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating change request:', error);
    return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 });
  }
}
