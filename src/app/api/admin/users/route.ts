import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { SystemRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  title: z.string().optional(),
  role: z.nativeEnum(SystemRole),
  password: z.string().min(6),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        title: data.title,
        role: data.role,
        passwordHash,
        organizationId: session.organizationId,
      },
    });

    // Log Security Audit Event
    if (session.organizationId) {
      await prisma.securityAuditLog.create({
        data: {
          organizationId: session.organizationId,
          actorEmail: session.email,
          action: 'USER_PROVISIONED',
          resource: `User:${user.email}`,
          details: `Provisioned user with role ${user.role}`,
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to provision user' }, { status: 500 });
  }
}
