import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox, Mail, Trash2, ArrowLeft } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, StatusBadge, ConfirmDialog } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../utils/format';

const STATUSES = [
  { value: 'new', label: 'New', tone: 'terracotta' },
  { value: 'in-progress', label: 'In progress', tone: 'amber' },
  { value: 'resolved', label: 'Resolved', tone: 'green' },
];
const toneFor = (status) => STATUSES.find((s) => s.value === status)?.tone || 'neutral';
const labelFor = (status) => STATUSES.find((s) => s.value === status)?.label || status;

function EnquiryDetail({ enquiry, onUpdated, onDelete, onBack }) {
  const [notes, setNotes] = useState(enquiry.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => setNotes(enquiry.adminNotes || ''), [enquiry]);

  const update = async (changes, message) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/contact/${enquiry._id}`, changes);
      onUpdated(data.enquiry);
      notify(message);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const mailto = `mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: your ${enquiry.enquiryType.toLowerCase()} - Sew Lets Face It`)}`;

  return (
    <Card className="p-6">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-terracotta lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Back to list
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl">{enquiry.name}</h2>
          <a href={mailto} className="text-sm text-terracotta hover:underline">
            {enquiry.email}
          </a>
        </div>
        <StatusBadge tone={toneFor(enquiry.status)}>{labelFor(enquiry.status)}</StatusBadge>
      </div>

      <dl className="mt-6 grid gap-4 border-y border-beige py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted uppercase">Type</dt>
          <dd className="mt-0.5">{enquiry.enquiryType}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Received</dt>
          <dd className="mt-0.5">{formatDateTime(enquiry.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Interest</dt>
          <dd className="mt-0.5">{enquiry.interest || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Product reference</dt>
          <dd className="mt-0.5 break-words">{enquiry.productReference || '-'}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Message</h3>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-charcoal">{enquiry.message}</p>
      </div>

      <div className="mt-6 space-y-4 border-t border-beige pt-5">
        <div>
          <span className="label">Status</span>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={saving || enquiry.status === s.value}
                onClick={() => update({ status: s.value }, `Marked as ${s.label.toLowerCase()}.`)}
                className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                  enquiry.status === s.value
                    ? 'border-charcoal bg-charcoal text-cream'
                    : 'border-beige-dark hover:border-charcoal disabled:opacity-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="admin-notes" className="label">
            Private notes
          </label>
          <textarea
            id="admin-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            className="input"
            placeholder="Only visible to admins"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="light"
              disabled={saving || notes === (enquiry.adminNotes || '')}
              onClick={() => update({ adminNotes: notes }, 'Notes saved.')}
            >
              Save notes
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-beige pt-5">
        <Button href={mailto} size="sm">
          <Mail className="size-4" aria-hidden /> Reply by email
        </Button>
        <Button size="sm" variant="light" onClick={onDelete} className="hover:!border-red-300 hover:!text-red-700">
          <Trash2 className="size-4" aria-hidden /> Delete
        </Button>
      </div>
    </Card>
  );
}

export default function Enquiries() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const selectedId = params.get('id');
  const { data, loading, error, reload, setData } = useApi('/contact', { params: status ? { status } : {} });
  const { notify } = useToast();
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const enquiries = data?.enquiries || [];
  const selected = enquiries.find((e) => e._id === selectedId);

  const { data: single } = useApi(selectedId && !selected ? `/contact/${selectedId}` : null, {
    enabled: Boolean(selectedId && !selected && !loading),
  });
  const detail = selected || single?.enquiry;

  const setParam = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const onUpdated = (enquiry) => {
    setData((d) => ({ ...d, enquiries: d.enquiries.map((e) => (e._id === enquiry._id ? enquiry : e)) }));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/contact/${toDelete._id}`);
      notify('Enquiry deleted.');
      setToDelete(null);
      setParam({ id: '' });
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Enquiries" description="Messages from the contact and custom creation forms." />

      <div className="mb-4 flex flex-wrap gap-2">
        {[{ value: '', label: 'All' }, ...STATUSES].map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setParam({ status: s.value, id: '' })}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              status === s.value ? 'border-forest bg-forest text-cream' : 'border-beige-dark bg-white hover:border-forest'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className={`overflow-hidden ${detail ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="py-16 text-center text-terracotta">
              <Spinner label="Loading enquiries…" />
            </div>
          ) : enquiries.length === 0 ? (
            <EmptyState icon={Inbox} title="No enquiries">
              {status ? 'Nothing with this status right now.' : 'New messages from the website will appear here.'}
            </EmptyState>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-beige overflow-y-auto">
              {enquiries.map((e) => (
                <li key={e._id}>
                  <button
                    type="button"
                    onClick={() => setParam({ id: e._id })}
                    className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-cream ${
                      e._id === selectedId ? 'bg-beige/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${e.status === 'new' ? 'font-semibold' : 'font-medium'}`}>{e.name}</span>
                      <span className="shrink-0 text-xs text-muted">{formatDate(e.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted">{e.enquiryType} · {e.message}</span>
                      <StatusBadge tone={toneFor(e.status)}>{labelFor(e.status)}</StatusBadge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          {detail ? (
            <EnquiryDetail
              enquiry={detail}
              onUpdated={onUpdated}
              onDelete={() => setToDelete(detail)}
              onBack={() => setParam({ id: '' })}
            />
          ) : (
            <Card className="hidden h-full min-h-60 items-center justify-center p-10 text-center text-sm text-muted lg:flex">
              Select an enquiry to see the full message.
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete enquiry?" onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}>
        <p>The enquiry from {toDelete?.name} will be permanently deleted. This can't be undone.</p>
      </ConfirmDialog>
    </>
  );
}
