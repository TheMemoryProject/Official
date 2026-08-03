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
  isGuest: boolean;
}

export { AUTH_COOKIE_NAME };

export const GUEST_SESSION: UserSession = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'guest@ktn.io',
  fullName: 'KTN Guest Explorer',
  role: 'ADMIN',
  organizationId: null,
  organizationName: 'KTN Enterprise Engineering Co.',
  isGuest: true,
};

let cachedGuest: UserSession | null = null;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getGuestSession(): Promise<UserSession> {
  if (cachedGuest) return cachedGuest;
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'guest@ktn.io' },
      include: { organization: { select: { name: true } } },
    });
    if (user && !user.deletedAt) {
      cachedGuest = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
        isGuest: true,
      };
      return cachedGuest;
    }
  } catch (error) {
    console.error('Failed to resolve guest session:', error);
  }
  return GUEST_SESSION;
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    // No login required: anonymous visitors are auto-authenticated as guests.
    if (!token) {
      return getGuestSession();
    }

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

    if (!user || user.deletedAt) return getGuestSession();

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name || null,
      isGuest: false,
    };
  } catch (error) {
    console.error('Failed to resolve session:', error);
    return getGuestSession();
  }
}
