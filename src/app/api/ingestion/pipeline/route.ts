import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { executeIngestionPipeline } from '@/lib/ingestion/pipeline-engine';
import { z } from 'zod';

const startIngestionSchema = z.object({
  title: z.string().min(3),
  originalFilename: z.string().min(3),
  mimeType: z.string().default('application/pdf'),
  fileSize: z.number().default(1024500),
});

export async function GET() {
  try {
    const documents = await prisma.ingestedDocument.findMany({
      include: {
        contributor: { select: { fullName: true } },
        extractedEntities: true,
        ingestionJobs: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching ingested documents:', error);
    return NextResponse.json({ error: 'Failed to fetch ingested documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = startIngestionSchema.parse(body);

    const doc = await prisma.ingestedDocument.create({
      data: {
        title: data.title,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        checksum: 'sha256-a8f9b0c1d2e3f4a5',
        storageUrl: 's3://ktn-docs/specs/aero-09.pdf',
        processingStatus: 'EXTRACTED',
        contributorId: session.id,
      },
    });

    const pipelineResult = executeIngestionPipeline({
      documentId: doc.id,
      originalFilename: data.originalFilename,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    });

    await prisma.ingestionJob.create({
      data: {
        documentId: doc.id,
        stage: 'COMPLETED',
        status: 'SUCCESS',
        recordsProcessed: pipelineResult.extractedEntitiesCount,
      },
    });

    return NextResponse.json({ success: true, document: doc, pipelineResult });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error executing ingestion pipeline:', error);
    return NextResponse.json({ error: 'Failed to execute ingestion pipeline' }, { status: 500 });
  }
}
