import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(3),
  description: z.string().min(10),
  phase: z.string().default('DETAILED_DESIGN'),
  programId: z.string().uuid(),
  domainId: z.string().uuid(),
  industryId: z.string().uuid(),
});

export async function GET() {
  try {
    const projects = await prisma.engineeringProject.findMany({
      include: {
        program: { select: { name: true } },
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        owner: { select: { fullName: true } },
        milestones: true,
        knowledge: { select: { id: true, title: true, verificationStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const portfolios = await prisma.engineeringPortfolio.findMany({
      include: {
        programs: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ projects, portfolios });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await prisma.engineeringProject.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        phase: data.phase,
        programId: data.programId,
        domainId: data.domainId,
        industryId: data.industryId,
        organizationId: session.organizationId || '00000000-0000-0000-0000-000000000000',
        ownerId: session.id,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
