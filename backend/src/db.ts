import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://ktn_app_runtime:ktn_app_runtime_password@localhost:5432/ktn_debkg',
  max: 10,
});

/** Returns the tenant UUID used for RLS-scoped queries. */
export function tenantId(): string {
  return process.env.TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
}

export async function ping(): Promise<void> {
  await pool.query('SELECT 1');
}

export type QueryResultRow = Record<string, unknown>;

export async function query<T = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params as unknown[]);
  return res.rows as T[];
}

export async function queryOne<T = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}
