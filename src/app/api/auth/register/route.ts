import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, AUTH_COOKIE_NAME } from '@/lib/auth/session';
import { z } from 'zod';
import { SystemRole } from '@prisma/client';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'VERIFIER', 'CONTRIBUTOR', 'ENGINEER', 'VIEWER']).default('ENGINEER'),
  organizationName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    let organizationId: string | null = null;

    if (validatedData.organizationName && validatedData.organizationName.trim() !== '') {
      const slug = validatedData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const org = await prisma.organization.upsert({
        where: { slug },
        update: {},
        create: {
          name: validatedData.organizationName,
          slug: slug || `org-${Date.now()}`,
          description: `Engineering organization for ${validatedData.organizationName}`,
        },
      });

      organizationId = org.id;
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role as SystemRole,
        organizationId,
      },
    });

    if (organizationId) {
      await prisma.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: user.role,
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
