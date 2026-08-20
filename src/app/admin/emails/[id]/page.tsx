'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditEmailTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/admin/emails/${id}`).then((r) => r.json()).then((d) => {
      if (d.template) {
        setTemplate(d.template);
        setSubject(d.template.subject);
        setBody(d.template.body);
        setEnabled(d.template.is_enabled);
      }
    });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/admin/emails/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, is_enabled: enabled }),
    });
    setSaving(false);
    setMessage(res.ok ? 'Saved' : 'Error saving');
  };

  if (!template) return <div className="py-20 text-center text-neutral-500">Loading...</div>;

  return (
    <div>
      <Link href="/admin/emails" className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>
      <h1 className="mt-2 text-2xl font-bold">{template.name}</h1>
      <p className="text-sm text-neutral-500">{template.type}</p>

      <div className="mt-8 max-w-3xl space-y-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded" />
          Enabled (send automatically)
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Body</label>
          <textarea rows={16} value={body} onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-medium text-neutral-500 mb-2">Preview subject</p>
          <p className="text-sm">{subject}</p>
          <p className="mt-3 text-xs font-medium text-neutral-500 mb-2">Preview body</p>
          <pre className="whitespace-pre-wrap text-sm text-neutral-700">{body}</pre>
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save template'}
        </button>
      </div>
    </div>
  );
}
