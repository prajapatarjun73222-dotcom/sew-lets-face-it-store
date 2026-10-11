import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ArrowUp, ImageOff } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Toggle } from '../../components/admin/AdminUI';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { sizedImage } from '../../utils/format';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  price: '',
  salePrice: '',
  category: '',
  images: [''],
  variants: [],
  stock: 0,
  isFeatured: false,
  isPublished: true,
  isCustomisable: false,
};

const isUrl = (value) => /^https?:\/\/\S+$/i.test(value.trim());

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter a product name.';
  const price = Number(v.price);
  if (v.price === '' || !Number.isFinite(price) || price < 0) e.price = 'Please enter a valid price.';
  if (v.salePrice !== '' && (!Number.isFinite(Number(v.salePrice)) || Number(v.salePrice) < 0)) e.salePrice = 'Please enter a valid sale price.';
  else if (v.salePrice !== '' && Number(v.salePrice) >= price) e.salePrice = 'Sale price must be lower than the regular price.';
  if (!v.category) e.category = 'Please choose a category.';
  if (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0) e.stock = 'Stock must be a whole number of 0 or more.';
  const badImage = v.images.findIndex((url) => url.trim() && !isUrl(url));
  if (badImage >= 0) e.images = `Image ${badImage + 1} must be a full URL starting with http:// or https://`;
  if (v.variants.some((variant) => !variant.name.trim())) e.variants = 'Every variant needs a name (or remove empty ones).';
  return e;
}

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { notify } = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: catData } = useApi('/admin/categories');
  const categories = catData?.categories || [];
  const { data, loading, error } = useApi(isNew ? null : `/admin/products/${id}`, { enabled: !isNew });

  useEffect(() => {
    if (!data?.product) return;
    const p = data.product;
    setValues({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      price: String(p.price),
      salePrice: p.salePrice === null || p.salePrice === undefined ? '' : String(p.salePrice),
      category: p.category?._id || p.category || '',
      images: p.images?.length ? p.images : [''],
      variants: p.variants || [],
      stock: p.stock,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
      isCustomisable: p.isCustomisable,
    });
  }, [data]);

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const setImage = (index, value) => set('images', values.images.map((url, i) => (i === index ? value : url)));
  const moveImageUp = (index) => {
    const next = [...values.images];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    set('images', next);
  };
  const setVariant = (index, changes) =>
    set('variants', values.variants.map((v, i) => (i === index ? { ...v, ...changes } : v)));

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      salePrice: values.salePrice === '' ? null : Number(values.salePrice),
      category: values.category,
      images: values.images.map((u) => u.trim()).filter(Boolean),
      variants: values.variants.map((v) => ({ name: v.name.trim(), type: v.type })),
      stock: Number(values.stock),
      isFeatured: values.isFeatured,
      isPublished: values.isPublished,
      isCustomisable: values.isCustomisable,
    };
    if (!isNew && values.slug !== data?.product?.slug) payload.slug = values.slug;

    setSaving(true);
    try {
      if (isNew) {
        await api.post('/products', payload);
        notify('Product created.');
      } else {
        await api.put(`/products/${id}`, payload);
        notify('Product saved.');
      }
      navigate('/admin/products');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      const normalised = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, msg]) => [key.replace(/\[\d+\].*|\.\d+.*/, ''), msg])
      );
      setErrors(normalised);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && loading) return <PageLoader />;
  if (!isNew && error) return <Alert type="error">{error}</Alert>;

  return (
    <form onSubmit={submit} noValidate>
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-terracotta">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>
      <PageHeader
        title={isNew ? 'Add product' : 'Edit product'}
        actions={
          <>
            <Button to="/admin/products" variant="light" size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {isNew ? 'Create product' : 'Save changes'}
            </Button>
          </>
        }
      />
      {formError && <Alert type="error" className="mb-6">{formError}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <h2 className="text-2xl">Details</h2>
            <FormField label="Name" required error={errors.name}>
              {(props) => <input {...props} value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={120} />}
            </FormField>
            {!isNew && (
              <FormField label="URL slug" hint="Used in the product web address. Leave as-is unless you need to change it." error={errors.slug}>
                {(props) => <input {...props} value={values.slug} onChange={(e) => set('slug', e.target.value)} maxLength={80} />}
              </FormField>
            )}
            <FormField label="Description" error={errors.description} hint={`${values.description.length}/4000`}>
              {(props) => (
                <textarea {...props} rows={6} value={values.description} onChange={(e) => set('description', e.target.value)} maxLength={4000} />
              )}
            </FormField>
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-2xl">Images</h2>
              <p className="mt-1 text-xs text-muted">Paste image URLs (https://…). The first image is used on product cards.</p>
            </div>
            {errors.images && <p className="text-xs text-red-700">{errors.images}</p>}
            <ul className="space-y-3">
              {values.images.map((url, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-beige/60">
                    {isUrl(url) ? (
                      <img src={sizedImage(url, 120)} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageOff className="size-4 text-muted" aria-hidden />
                    )}
                  </div>
                  <input
                    value={url}
                    onChange={(e) => setImage(i, e.target.value)}
                    placeholder="https://…"
                    className="input flex-1"
                    aria-label={`Image URL ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => moveImageUp(i)}
                    disabled={i === 0}
                    className="rounded-sm p-2 text-muted hover:bg-beige/60 disabled:opacity-30"
                    aria-label="Move image up"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => set('images', values.images.length > 1 ? values.images.filter((_, idx) => idx !== i) : [''])}
                    className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {values.images.length < 10 && (
              <Button type="button" variant="light" size="sm" onClick={() => set('images', [...values.images, ''])}>
                <Plus className="size-4" aria-hidden /> Add image
              </Button>
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-2xl">Fabric &amp; colour variants</h2>
              <p className="mt-1 text-xs text-muted">Optional choices customers can pick from, e.g. “Sage” or “Floral print”.</p>
            </div>
            {errors.variants && <p className="text-xs text-red-700">{errors.variants}</p>}
            {values.variants.length === 0 && <p className="text-sm text-muted">No variants - customers won't be asked to choose.</p>}
            <ul className="space-y-3">
              {values.variants.map((variant, i) => (
                <li key={i} className="flex items-center gap-3">
                  <input
                    value={variant.name}
                    onChange={(e) => setVariant(i, { name: e.target.value })}
                    placeholder="Variant name"
                    maxLength={60}
                    className="input flex-1"
                    aria-label={`Variant ${i + 1} name`}
                  />
                  <select
                    value={variant.type}
                    onChange={(e) => setVariant(i, { type: e.target.value })}
                    className="input w-32"
                    aria-label={`Variant ${i + 1} type`}
                  >
                    <option value="fabric">Fabric</option>
                    <option value="colour">Colour</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => set('variants', values.variants.filter((_, idx) => idx !== i))}
                    className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {values.variants.length < 20 && (
              <Button
                type="button"
                variant="light"
                size="sm"
                onClick={() => set('variants', [...values.variants, { name: '', type: 'fabric' }])}
              >
                <Plus className="size-4" aria-hidden /> Add variant
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <h2 className="text-2xl">Pricing &amp; stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Price (£)" required error={errors.price}>
                {(props) => (
                  <input {...props} type="number" min="0" step="0.01" inputMode="decimal" value={values.price} onChange={(e) => set('price', e.target.value)} />
                )}
              </FormField>
              <FormField label="Sale price (£)" error={errors.salePrice}>
                {(props) => (
                  <input
                    {...props}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={values.salePrice}
                    onChange={(e) => set('salePrice', e.target.value)}
                    placeholder="Optional"
                  />
                )}
              </FormField>
            </div>
            <FormField label="Stock available" required error={errors.stock} hint="Set to 0 to show as sold out.">
              {(props) => (
                <input {...props} type="number" min="0" step="1" value={values.stock} onChange={(e) => set('stock', e.target.value)} />
              )}
            </FormField>
          </Card>

          <Card className="space-y-5 p-6">
            <h2 className="text-2xl">Organisation</h2>
            <FormField label="Category" required error={errors.category}>
              {(props) => (
                <select {...props} value={values.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.isVisible ? '' : ' (hidden)'}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <div className="space-y-4 border-t border-beige pt-5">
              <Toggle
                checked={values.isPublished}
                onChange={(v) => set('isPublished', v)}
                label="Published"
                description="Visible in the shop when on."
              />
              <Toggle
                checked={values.isFeatured}
                onChange={(v) => set('isFeatured', v)}
                label="Featured"
                description="Shown in the homepage Featured Collection."
              />
              <Toggle
                checked={values.isCustomisable}
                onChange={(v) => set('isCustomisable', v)}
                label="Personalisable"
                description="Shows an optional personalisation field."
              />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
