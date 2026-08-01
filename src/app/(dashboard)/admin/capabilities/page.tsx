import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, type Role } from '@/lib/auth/rbac';
import { loadLedger, summarise, type Capability, type CapabilityStatus } from '@/lib/capabilities/ledger';

export const dynamic = 'force-dynamic';

const STATUS_ORDER: CapabilityStatus[] = ['REAL', 'PARTIAL', 'SHELL', 'ABSENT'];

const STATUS_STYLES: Record<CapabilityStatus, string> = {
  REAL: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  PARTIAL: 'bg-amber-50 text-amber-800 border-amber-300',
  SHELL: 'bg-rose-50 text-rose-800 border-rose-300',
  ABSENT: 'bg-slate-50 text-slate-600 border-slate-300',
};

const SUMMARY_STYLES: Record<CapabilityStatus, string> = {
  REAL: 'border-emerald-300 bg-emerald-50',
  PARTIAL: 'border-amber-300 bg-amber-50',
  SHELL: 'border-rose-300 bg-rose-50',
  ABSENT: 'border-slate-300 bg-slate-50',
};

function CapabilityRow({ capability }: { capability: Capability }) {
  const { status } = capability;

  return (
    <tr className="border-b border-slate-200 align-top">
      <td className="px-3 py-3">
        <span
          className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="font-medium text-slate-900">{capability.name}</div>
        <code className="text-xs text-slate-500">{capability.id}</code>
        {capability.mechanism && (
          <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
            {capability.mechanism}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-slate-700">{capability.notes}</td>
      <td className="px-3 py-3 text-xs text-slate-600">
        {capability.evidence.tests.length > 0 ? (
          <ul className="space-y-0.5">
            {capability.evidence.tests.map((t) => (
              <li key={t}>
                <code>{t}</code>
              </li>
            ))}
          </ul>
        ) : (
          <span className="italic text-slate-400">none</span>
        )}
      </td>
    </tr>
  );
}

export default async function CapabilitiesLedgerPage() {
  const session = await getSession();

  if (!session) redirect('/login?redirect=/admin/capabilities');
  if (!hasPermission(session.role as Role, 'audit:view')) redirect('/dashboard');

  const ledger = loadLedger();
  const summary = summarise(ledger);

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    items: ledger.capabilities.filter((c) => c.status === status),
  }));

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Capability Ledger</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          The authoritative record of what this system can actually do. A capability is{' '}
          <strong>REAL</strong> only when it is reachable and covered by a test that exercises the
          real path end to end — enforced by <code>tests/ledger.spec.ts</code>, which fails the
          build otherwise.
        </p>
        <p className="max-w-3xl rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>No demo, sales, or marketing surface may claim a capability this ledger does not
          mark REAL.</strong>{' '}
          Read the machine-readable source at <code>GET /api/system/capabilities</code>.
        </p>
        <p className="text-xs text-slate-500">
          Ledger v{ledger.ledgerVersion} · audit phase {ledger.auditPhase} · commit{' '}
          <code>{ledger.commitAudited}</code> · generated {ledger.generatedAt}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUS_ORDER.map((status) => (
          <div key={status} className={`rounded-lg border p-4 ${SUMMARY_STYLES[status]}`}>
            <div className="text-2xl font-bold text-slate-900">{summary[status]}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              {status}
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-slate-300 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Total</div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Status definitions
        </h2>
        <dl className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex gap-3">
              <dt
                className={`w-20 shrink-0 rounded border px-2 py-0.5 text-center text-xs font-semibold ${STATUS_STYLES[status]}`}
              >
                {status}
              </dt>
              <dd className="text-slate-700">{ledger.statusDefinitions[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {byStatus.map(({ status, items }) =>
        items.length === 0 ? null : (
          <section key={status} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              {status} ({items.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="w-72 px-3 py-2">Capability</th>
                    <th className="px-3 py-2">Assessment</th>
                    <th className="w-56 px-3 py-2">Test evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <CapabilityRow key={c.id} capability={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      )}
    </div>
  );
}
