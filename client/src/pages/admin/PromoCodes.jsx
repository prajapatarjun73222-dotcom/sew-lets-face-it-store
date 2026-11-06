import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, StatusBadge, ConfirmDialog, Toggle } from '../../components/admin/AdminUI';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const EMPTY = { code: '', type: 'percentage', amount: 10, expiresAt: '', isActive: true };

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatExpiry(value) {
  if (!value) return 'No expiry';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'No expiry';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(value) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

function PromoForm({ initial, onSaved, onCancel }) {
  const [values, setValues] = useState({
    ...initial,
    expiresAt: toDateInput(initial.expiresAt),
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const isNew = !initial._id;

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    const code = values.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) found.code = 'Use 3-20 letters or numbers.';
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 100) found.amount = 'Enter a percentage between 1 and 100.';
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      code,
      type: 'percentage',
      amount,
      expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59.999Z`).toISOString() : null,
      isActive: values.isActive,
    };

    setSaving(true);
    setMessage('');
    try {
      if (isNew) await api.post('/admin/promo-codes', payload);
      else await api.put(`/admin/promo-codes/${initial._id}`, payload);
      onSaved(isNew ? 'Promo code created.' : 'Promo code saved.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {message && <Alert type="error">{message}</Alert>}
      <FormField label="Code" required error={errors.code} hint="Customers enter this at checkout (e.g. SAVE10).">
        {(props) => (
          <input
            {...props}
            value={values.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            maxLength={20}
            className={`${props.className} uppercase`}
            autoComplete="off"
          />
        )}
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Type" hint="Only percentage off the bag is supported.">
          {(props) => <input {...props} value="Percentage" disabled readOnly />}
        </FormField>
        <FormField label="Amount (%)" required error={errors.amount}>
          {(props) => (
            <input
              {...props}
              type="number"
              min="1"
              max="100"
              step="1"
              value={values.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
          )}
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Expiry date" error={errors.expiresAt} hint="Optional. Leave blank for no expiry.">
          {(props) => (
            <input {...props} type="date" value={values.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
          )}
        </FormField>
        <div className="pt-6">
          <Toggle checked={values.isActive} onChange={(v) => set('isActive', v)} label="Active" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-beige pt-5">
        <Button type="button" variant="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isNew ? 'Create code' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export default function PromoCodes() {
  const { data, loading, error, reload } = useApi('/admin/promo-codes');
  const { notify } = useToast();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const promoCodes = data?.promoCodes || [];

  const toggleActive = async (promo) => {
    try {
      await api.put(`/admin/promo-codes/${promo._id}`, { isActive: !promo.isActive });
      notify(promo.isActive ? 'Promo code deactivated.' : 'Promo code activated.');
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/promo-codes/${toDelete._id}`);
      notify('Promo code deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Promo codes"
        description="Create percentage discounts customers can apply at checkout."
        actions={
          <Button size="sm" onClick={() => setEditing(EMPTY)}>
            <Plus className="size-4" aria-hidden /> Add code
          </Button>
        }
      />
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-beige bg-cream/60 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-terracotta">
                  <Spinner label="Loading promo codes…" />
                </td>
              </tr>
            ) : promoCodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-muted">
                  No promo codes yet.
                </td>
              </tr>
            ) : (
              promoCodes.map((promo) => {
                const expired = isExpired(promo.expiresAt);
                return (
                  <tr key={promo._id}>
                    <td className="px-4 py-3 font-medium tracking-wide">{promo.code}</td>
                    <td className="px-4 py-3">{promo.amount}% off</td>
                    <td className="px-4 py-3">{formatExpiry(promo.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleActive(promo)} title="Toggle active">
                        <StatusBadge tone={!promo.isActive ? 'neutral' : expired ? 'amber' : 'green'}>
                          {!promo.isActive ? 'Inactive' : expired ? 'Expired' : 'Active'}
                        </StatusBadge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              _id: promo._id,
                              code: promo.code,
                              type: 'percentage',
                              amount: promo.amount,
                              expiresAt: promo.expiresAt || '',
                              isActive: promo.isActive,
                            })
                          }
                          className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-charcoal"
                          aria-label={`Edit ${promo.code}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setToDelete(promo);
                          }}
                          className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${promo.code}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? 'Edit promo code' : 'Add promo code'}>
        {editing && (
          <PromoForm
            key={editing._id || 'new'}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSaved={(msg) => {
              notify(msg);
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete promo code?"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      >
        <p>
          “{toDelete?.code}” will be permanently removed. Customers will no longer be able to use it at checkout.
        </p>
        {deleteError && <Alert type="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmDialog>
    </>
  );
}
