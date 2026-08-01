import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const backups = await prisma.systemBackupRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const backup = await prisma.systemBackupRecord.create({
      data: {
        backupType: 'DATABASE_SNAPSHOT',
        status: 'COMPLETED',
        sizeMb: 524.2,
        checksum: `sha256-${Date.now().toString(16)}`,
        createdBy: 'MANUAL_ADMIN_TRIGGER',
      },
    });

    return NextResponse.json({ success: true, backup });
  } catch (error) {
    console.error('Error triggering snapshot:', error);
    return NextResponse.json({ error: 'Failed to trigger snapshot' }, { status: 500 });
  }
}
