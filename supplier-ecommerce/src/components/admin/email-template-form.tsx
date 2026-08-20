'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailTemplate } from '@/types/database';

interface Props {
  template: EmailTemplate;
}

export function EmailTemplateForm({ template }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [isEnabled, setIsEnabled] = useState(template.is_enabled);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          subject,
          body,
          is_enabled: isEnabled,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed');
      } else {
        setMessage('Template saved');
        router.refresh();
      }
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id }),
      });
      const data = await res.json();
      setMessage(res.ok ? 'Test email sent' : data.error || 'Failed');
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Enabled (emails of this type will be sent)
        </label>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Body</label>
          <textarea
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="font-semibold text-neutral-900">Preview</h3>
          <p className="mt-2 text-sm font-medium">{subject}</p>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-neutral-600">{body}</pre>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.includes('saved') || message.includes('sent')
              ? 'text-emerald-600'
              : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setPreview(!preview)}
          className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          {preview ? 'Hide preview' : 'Preview'}
        </button>
        <button
          onClick={handleTest}
          disabled={loading}
          className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        >
          Send test email
        </button>
      </div>
    </div>
  );
}
