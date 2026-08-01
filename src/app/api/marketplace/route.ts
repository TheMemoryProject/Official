import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const publishListingSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  licenseType: z.string().default('OPEN'),
  visibilityScope: z.string().default('PUBLIC'),
});

export async function GET() {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      include: {
        publisherOrg: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const consortiums = await prisma.engineeringConsortium.findMany({
      include: {
        leadOrg: { select: { name: true } },
      },
    });

    return NextResponse.json({ listings, consortiums });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized. Organization required.' }, { status: 401 });
    }

    const body = await request.json();
    const data = publishListingSchema.parse(body);

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: data.title,
        summary: data.summary,
        licenseType: data.licenseType,
        visibilityScope: data.visibilityScope,
        publisherOrgId: session.organizationId,
        verificationStatus: 'VERIFIED',
      },
    });

    return NextResponse.json({ success: true, listing });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error publishing listing:', error);
    return NextResponse.json({ error: 'Failed to publish listing' }, { status: 500 });
  }
}
