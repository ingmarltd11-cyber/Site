import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminEmailLogsPage() {
  const supabase = createServiceClient();
  const { data: logs } = await supabase
    .from('email_logs')
    .select('*, orders(order_number)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold">Email logs</h1>
      <p className="mt-1 text-sm text-neutral-500">History of sent transactional emails</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(logs || []).map((log: any) => (
              <tr key={log.id}>
                <td className="px-4 py-3">{log.recipient}</td>
                <td className="px-4 py-3 text-neutral-500">{log.email_type}</td>
                <td className="px-4 py-3 max-w-xs truncate">{log.subject}</td>
                <td className="px-4 py-3 text-neutral-500">{log.orders?.order_number || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                    log.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-500'
                  }`}>{log.status}</span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(log.created_at)}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No emails sent yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
