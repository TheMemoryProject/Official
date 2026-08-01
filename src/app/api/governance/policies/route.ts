import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const createPolicySchema = z.object({
  name: z.string().min(3),
  policyType: z.string().default('CLASSIFICATION'),
  classification: z.string().default('CONFIDENTIAL'),
  retentionYears: z.number().default(10),
});

export async function GET() {
  try {
    const policies = await prisma.governancePolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching governance policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const data = createPolicySchema.parse(body);

    const policy = await prisma.governancePolicy.create({
      data: {
        name: data.name,
        policyType: data.policyType,
        classification: data.classification,
        retentionYears: data.retentionYears,
        organizationId: session.organizationId || '00000000-0000-0000-0000-000000000000',
      },
    });

    return NextResponse.json({ success: true, policy });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating governance policy:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
