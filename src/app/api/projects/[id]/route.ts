import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const project = await prisma.engineeringProject.findUnique({
      where: { id: params.id },
      include: {
        program: { select: { name: true } },
        domain: { select: { name: true } },
        industry: { select: { name: true } },
        owner: { select: { fullName: true, email: true } },
        milestones: true,
        knowledge: {
          include: {
            domain: { select: { name: true } },
            attachments: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project detail:', error);
    return NextResponse.json({ error: 'Failed to fetch project detail' }, { status: 500 });
  }
}
