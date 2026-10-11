import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Search, ExternalLink } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, StatusBadge, ConfirmDialog } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { formatPrice, hasSale, sizedImage, LOW_STOCK } from '../../utils/format';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { notify } = useToast();

  const query = {
    page: params.get('page') || 1,
    limit: 15,
    sort: params.get('sort') || 'newest',
    ...(params.get('search') && { search: params.get('search') }),
    ...(params.get('category') && { category: params.get('category') }),
    ...(params.get('status') && { status: params.get('status') }),
  };
  const { data, loading, error, reload, setData } = useApi('/admin/products', { params: query });
  const { data: catData } = useApi('/admin/categories');
  const categories = catData?.categories || [];

  const setParam = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in updates)) next.delete('page');
    setParams(next, { replace: true });
  };

  const patch = async (product, changes, message) => {
    setBusyId(product._id);
    try {
      const { data: res } = await api.put(`/products/${product._id}`, changes);
      setData((d) => ({
        ...d,
        products: d.products.map((p) => (p._id === product._id ? { ...p, ...res.product, category: p.category } : p)),
      }));
      notify(message);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete._id}`);
      notify(`"${toDelete.name}" deleted.`);
      setToDelete(null);
      reload();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <>
      <PageHeader
        title="Products"
        description="Add, edit, hide or remove products. Changes appear on the website immediately."
        actions={
          <Button to="/admin/products/new" size="sm">
            <Plus className="size-4" aria-hidden /> Add product
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ search: search.trim() });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description, then press Enter"
            className="input pl-9"
            aria-label="Search products"
          />
        </form>
        <select
          value={params.get('category') || ''}
          onChange={(e) => setParam({ category: e.target.value })}
          className="input md:w-48"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={params.get('status') || ''}
          onChange={(e) => setParam({ status: e.target.value })}
          className="input md:w-40"
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </Card>

      {error && (
        <Alert type="error" className="mb-4" action={<button onClick={reload} className="text-sm underline">Retry</button>}>
          {error}
        </Alert>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-beige bg-cream/60 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-terracotta">
                  <Spinner label="Loading products…" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted">
                  No products found.{' '}
                  <Link to="/admin/products/new" className="text-terracotta underline">
                    Add one
                  </Link>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className={busyId === p._id ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={sizedImage(p.images[0], 100)} alt="" className="size-12 rounded-sm object-cover" />
                      ) : (
                        <span className="size-12 rounded-sm bg-beige" />
                      )}
                      <div className="min-w-0">
                        <Link to={`/admin/products/${p._id}`} className="font-medium text-charcoal hover:text-terracotta">
                          {p.name}
                        </Link>
                        <p className="truncate text-xs text-muted">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name || <StatusBadge tone="red">Missing</StatusBadge>}</td>
                  <td className="px-4 py-3">
                    {hasSale(p) ? (
                      <>
                        <span className="text-terracotta">{formatPrice(p.salePrice)}</span>{' '}
                        <span className="text-xs text-muted line-through">{formatPrice(p.price)}</span>
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={p.stock === 0 ? 'red' : p.stock <= LOW_STOCK ? 'amber' : 'green'}>{p.stock}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge tone={p.isPublished ? 'green' : 'neutral'}>{p.isPublished ? 'Published' : 'Hidden'}</StatusBadge>
                      {p.isFeatured && <StatusBadge tone="terracotta">Featured</StatusBadge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => patch(p, { isFeatured: !p.isFeatured }, p.isFeatured ? 'Removed from featured.' : 'Marked as featured.')}
                        className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-terracotta"
                        title={p.isFeatured ? 'Unfeature' : 'Feature on homepage'}
                        aria-label={p.isFeatured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
                      >
                        <Star className={`size-4 ${p.isFeatured ? 'fill-terracotta text-terracotta' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => patch(p, { isPublished: !p.isPublished }, p.isPublished ? 'Product hidden.' : 'Product published.')}
                        className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-charcoal"
                        title={p.isPublished ? 'Hide from shop' : 'Publish'}
                        aria-label={p.isPublished ? `Hide ${p.name}` : `Publish ${p.name}`}
                      >
                        {p.isPublished ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                      {p.isPublished && (
                        <a
                          href={`/product/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-charcoal"
                          title="View on site"
                          aria-label={`View ${p.name} on site`}
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                      <Link
                        to={`/admin/products/${p._id}`}
                        className="rounded-sm p-2 text-muted hover:bg-beige/60 hover:text-charcoal"
                        title="Edit"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(p)}
                        className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                        title="Delete"
                        aria-label={`Delete ${p.name}`}
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

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total} products
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="light" disabled={pagination.page <= 1} onClick={() => setParam({ page: String(pagination.page - 1) })}>
              Previous
            </Button>
            <Button size="sm" variant="light" disabled={!pagination.hasMore} onClick={() => setParam({ page: String(pagination.page + 1) })}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete product?"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      >
        <p>
          “{toDelete?.name}” will be permanently removed. If you might sell it again, consider hiding it instead.
        </p>
      </ConfirmDialog>
    </>
  );
}
