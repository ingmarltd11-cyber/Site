import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminEmailsPage() {
  const supabase = createServiceClient();
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('type');

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Email templates
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Edit transactional email content. Variables like {'{{order_number}}'} are replaced automatically.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {(templates || []).map((t) => (
          <Link
            key={t.id}
            href={`/admin/emails/${t.id}`}
            className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-neutral-900">{t.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">{t.type}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  t.is_enabled
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {t.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="mt-3 truncate text-sm text-neutral-600">{t.subject}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h3 className="font-semibold text-neutral-900">Available variables</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'customer_name',
            'customer_email',
            'order_number',
            'order_date',
            'order_total',
            'subtotal',
            'shipping_cost',
            'discount',
            'order_items',
            'shipping_address',
            'tracking_number',
            'store_name',
          ].map((v) => (
            <code
              key={v}
              className="rounded bg-white px-2 py-1 text-xs text-neutral-700 border border-neutral-200"
            >
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
