import { createClient } from '@supabase/supabase-js';

// Server-only. Uses the service-role key so it can bypass RLS to insert
// uploaded rows. NEVER import this file from a client component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// PostgREST caps every response at a fixed number of rows (Supabase
// projects default `db_max_rows` to 1000) regardless of what you pass to
// .select() or .limit() — it's a server-side ceiling, not a client option.
// Any query that can match more rows than that MUST page through with
// .range() or it will silently return a truncated result. This helper
// does that paging so call sites never have to think about the cap.
const POSTGREST_PAGE_SIZE = 1000;

export async function fetchAllRows<T = any>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery(from, from + POSTGREST_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    allRows.push(...data);

    if (data.length < POSTGREST_PAGE_SIZE) break; // last page
    from += POSTGREST_PAGE_SIZE;
  }

  return allRows;
}

