import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { extractEntitiesFromDocument } from '@/lib/ingestion/extractor-engine';

export async function GET() {
  try {
    const documents = await prisma.ingestedDocument.findMany({
      include: {
        contributor: { select: { fullName: true } },
        extractedEntities: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Ingested documents API error:', error);
    return NextResponse.json({ error: 'Failed to fetch ingested documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, originalFilename, documentType, storageUrl, fileSize, rawText } = body;

    const doc = await prisma.ingestedDocument.create({
      data: {
        title: title || originalFilename,
        originalFilename,
        documentType: documentType || 'TEST_REPORT',
        mimeType: 'application/pdf',
        fileSize: fileSize || 1024500,
        checksum: `sha256-${Math.random().toString(36).substring(2, 10)}`,
        storageUrl: storageUrl || 'https://ktn-verify.supabase.co/storage/v1/object/public/ktn-documents/sample.pdf',
        processingStatus: 'EXTRACTED',
        contributorId: session.id,
        organizationId: session.organizationId,
      },
    });

    // Run entity extraction engine
    const extracted = extractEntitiesFromDocument(rawText || '');

    const entities = await Promise.all(
      extracted.map((e) =>
        prisma.extractedEntity.create({
          data: {
            documentId: doc.id,
            entityType: e.entityType as any,
            extractedText: e.extractedText,
            pageNumber: e.pageNumber,
            sectionName: e.sectionName,
            confidence: e.confidence,
          },
        })
      )
    );

    return NextResponse.json({ success: true, document: doc, entitiesCount: entities.length });
  } catch (error) {
    console.error('Document ingestion error:', error);
    return NextResponse.json({ error: 'Failed to process document ingestion' }, { status: 500 });
  }
}
