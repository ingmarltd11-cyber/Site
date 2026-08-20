import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminCustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = createServiceClient();
  let query = supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  const { data: customers } = await query.limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <form className="mt-6">
        <input name="q" defaultValue={q || ''} placeholder="Search name or email..."
          className="w-full max-w-md rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
      </form>
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(customers || []).map((c: { id: string; first_name: string | null; last_name: string | null; email: string; company_name: string | null; created_at: string }) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-neutral-600">{c.email}</td>
                <td className="px-4 py-3 text-neutral-500">{c.company_name || '—'}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {(!customers || customers.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No customers</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
