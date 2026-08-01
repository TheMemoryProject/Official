import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import crypto from 'crypto';

const createApiKeySchema = z.object({
  name: z.string().min(3),
  scopes: z.array(z.string()).default(['READ']),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      include: {
        owner: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const data = createApiKeySchema.parse(body);

    const rawKey = `ktn_live_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash: rawKey,
        scopesJson: JSON.stringify(data.scopes),
        ownerId: session.id,
        organizationId: session.organizationId || '00000000-0000-0000-0000-000000000000',
        expiresAt: new Date(Date.now() + 86400000 * 365),
      },
    });

    // Log Security Audit Event
    if (session.organizationId) {
      await prisma.securityAuditLog.create({
        data: {
          organizationId: session.organizationId,
          actorEmail: session.email,
          action: 'API_KEY_CREATED',
          resource: `ApiKey:${apiKey.name}`,
          details: `Provisioned API key with scopes ${data.scopes.join(',')}`,
        },
      });
    }

    return NextResponse.json({ success: true, apiKey, secretKey: rawKey });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to provision API key' }, { status: 500 });
  }
}
