import { useState } from 'react';
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, StatusBadge, ConfirmDialog, Toggle } from '../../components/admin/AdminUI';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { sizedImage } from '../../utils/format';

const EMPTY = { name: '', description: '', image: '', isVisible: true, sortOrder: 0 };
const isUrl = (v) => /^https?:\/\/\S+$/i.test(v.trim());

function CategoryForm({ initial, onSaved, onCancel }) {
  const [values, setValues] = useState(initial);
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
    if (values.name.trim().length < 2) found.name = 'Please enter a name (at least 2 characters).';
    if (values.image.trim() && !isUrl(values.image)) found.image = 'Image must be a full URL starting with https://';
    if (!Number.isInteger(Number(values.sortOrder)) || Number(values.sortOrder) < 0) found.sortOrder = 'Use a whole number of 0 or more.';
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      image: values.image.trim(),
      isVisible: values.isVisible,
      sortOrder: Number(values.sortOrder),
    };
    setSaving(true);
    setMessage('');
    try {
      if (isNew) await api.post('/categories', payload);
      else await api.put(`/categories/${initial._id}`, payload);
      onSaved(isNew ? 'Category created.' : 'Category saved.');
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
      <FormField label="Name" required error={errors.name}>
        {(props) => <input {...props} value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={60} />}
      </FormField>
      <FormField label="Description" error={errors.description}>
        {(props) => (
          <textarea {...props} rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
        )}
      </FormField>
      <FormField label="Image URL" error={errors.image} hint="Shown on the homepage category cards.">
        {(props) => <input {...props} value={values.image} onChange={(e) => set('image', e.target.value)} placeholder="https://…" />}
      </FormField>
      {isUrl(values.image) && (
        <img src={sizedImage(values.image, 300)} alt="Category preview" className="h-32 w-28 rounded-sm object-cover" />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Display order" error={errors.sortOrder} hint="Lower numbers appear first.">
          {(props) => (
            <input {...props} type="number" min="0" value={values.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
          )}
        </FormField>
        <div className="pt-6">
          <Toggle checked={values.isVisible} onChange={(v) => set('isVisible', v)} label="Visible on website" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-beige pt-5">
        <Button type="button" variant="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isNew ? 'Create category' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export default function Categories() {
  const { data, loading, error, reload } = useApi('/admin/categories');
  const { notify } = useToast();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const categories = data?.categories || [];

  const toggleVisibility = async (category) => {
    try {
      await api.put(`/categories/${category._id}`, { isVisible: !category.isVisible });
      notify(category.isVisible ? 'Category hidden.' : 'Category visible.');
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/categories/${toDelete._id}`);
      notify('Category deleted.');
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
        title="Categories"
        description="Organise products and control which categories appear on the website."
        actions={
          <Button size="sm" onClick={() => setEditing(EMPTY)}>
            <Plus className="size-4" aria-hidden /> Add category
          </Button>
        }
      />
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-beige bg-cream/60 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-terracotta">
                  <Spinner label="Loading categories…" />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-muted">
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <img src={sizedImage(c.image, 100)} alt="" className="size-12 rounded-sm object-cover" />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-sm bg-beige">
                          <ImageOff className="size-4 text-muted" aria-hidden />
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.productCount}</td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleVisibility(c)} title="Toggle visibility">
                      <StatusBadge tone={c.isVisible ? 'green' : 'neutral'}>{c.isVisible ? 'Visible' : 'Hidden'}</StatusBadge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            _id: c._id,
                            name: c.name,
                            description: c.description || '',
                            image: c.image || '',
                            isVisible: c.isVisible,
                            sortOrder: c.sortOrder ?? 0,
                          })
                        }
                        className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-charcoal"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('');
                          setToDelete(c);
                        }}
                        className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? 'Edit category' : 'Add category'}>
        {editing && (
          <CategoryForm
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
        title="Delete category?"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      >
        <p>“{toDelete?.name}” will be permanently removed. Categories that still contain products can't be deleted.</p>
        {deleteError && <Alert type="error" className="mt-4">{deleteError}</Alert>}
      </ConfirmDialog>
    </>
  );
}
