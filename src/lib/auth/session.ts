import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { SystemRole } from '@prisma/client';
import { AUTH_COOKIE_NAME } from './constants';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: SystemRole;
  organizationId: string | null;
  organizationName?: string | null;
}

export { AUTH_COOKIE_NAME };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const userId = token;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) return null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name || null,
    };
  } catch (error) {
    console.error('Failed to resolve session:', error);
    return null;
  }
}
