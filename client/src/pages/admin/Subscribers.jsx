import { useState } from 'react';
import { Users, Trash2, Copy, Download } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, ConfirmDialog } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/format';

export default function Subscribers() {
  const { data, loading, error, reload } = useApi('/newsletter');
  const { notify } = useToast();
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const subscribers = data?.subscribers || [];

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(', '));
      notify('Email addresses copied to clipboard.');
    } catch {
      notify('Could not access the clipboard.', 'error');
    }
  };

  const exportCsv = () => {
    const rows = [['email', 'source', 'subscribed'], ...subscribers.map((s) => [s.email, s.source, s.createdAt])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/newsletter/${toDelete._id}`);
      notify('Subscriber removed.');
      setToDelete(null);
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Newsletter"
        description={`${subscribers.length} ${subscribers.length === 1 ? 'subscriber' : 'subscribers'}`}
        actions={
          subscribers.length > 0 && (
            <>
              <Button size="sm" variant="light" onClick={copyAll}>
                <Copy className="size-4" aria-hidden /> Copy emails
              </Button>
              <Button size="sm" variant="light" onClick={exportCsv}>
                <Download className="size-4" aria-hidden /> Export CSV
              </Button>
            </>
          )
        }
      />
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      <Card className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-terracotta">
            <Spinner label="Loading subscribers…" />
          </div>
        ) : subscribers.length === 0 ? (
          <EmptyState icon={Users} title="No subscribers yet">
            People who sign up through the newsletter form will appear here.
          </EmptyState>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-beige bg-cream/60 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3 text-right font-medium">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige">
              {subscribers.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-muted">{s.source}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setToDelete(s)}
                      className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove ${s.email}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove subscriber?"
        confirmLabel="Remove"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      >
        <p>{toDelete?.email} will no longer receive newsletter updates.</p>
      </ConfirmDialog>
    </>
  );
}
