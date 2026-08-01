import { NextResponse } from 'next/server';
import { loadLedger, summarise } from '@/lib/capabilities/ledger';

export const dynamic = 'force-dynamic';

/**
 * The single source of truth for what this system can actually do.
 *
 * Every demo, sales, and marketing surface MUST read from here. A capability that is not
 * REAL in the ledger may not be presented as working anywhere in the product.
 *
 * Deliberately unauthenticated: this endpoint only ever discloses the honest status of
 * the platform's own features, which is information we want to be trivially verifiable.
 * It exposes no tenant data and no knowledge content.
 */
export async function GET(request: Request) {
  try {
    const ledger = loadLedger();
    const { searchParams } = new URL(request.url);

    const statusFilter = searchParams.get('status');
    const mechanismFilter = searchParams.get('mechanism');

    let capabilities = ledger.capabilities;

    if (statusFilter) {
      const wanted = statusFilter.toUpperCase();
      capabilities = capabilities.filter((c) => c.status === wanted);
    }

    if (mechanismFilter) {
      const wanted = mechanismFilter.toUpperCase();
      capabilities = capabilities.filter((c) => c.mechanism === wanted);
    }

    return NextResponse.json({
      ledgerVersion: ledger.ledgerVersion,
      generatedAt: ledger.generatedAt,
      commitAudited: ledger.commitAudited,
      auditPhase: ledger.auditPhase,
      statusDefinitions: ledger.statusDefinitions,
      rules: ledger.rules,
      summary: summarise(ledger),
      capabilities,
    });
  } catch (error) {
    console.error('Capability ledger read failed:', error);
    // Fail closed: if we cannot prove what we support, we claim nothing.
    return NextResponse.json(
      { error: 'Capability ledger unavailable. No capability can be asserted without it.' },
      { status: 503 }
    );
  }
}
