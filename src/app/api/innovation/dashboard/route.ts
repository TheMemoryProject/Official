import { NextResponse } from 'next/server';
import { getInnovationDashboard } from '@/lib/innovation/innovation-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getInnovationDashboard();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Innovation engine failure:', error);
    return NextResponse.json(
      { error: 'Innovation engine unavailable. Check the knowledge database connection.' },
      { status: 500 }
    );
  }
}
