import { useEffect, useState } from 'react';
import { Plus, Trash2, ImageOff } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { PageHeader, Card, Toggle } from '../../components/admin/AdminUI';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { isEmail, sizedImage } from '../../utils/format';

const isUrl = (v) => /^https?:\/\/\S+$/i.test(String(v).trim());

function ImageInput({ label, value, onChange, error, hint }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-6 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-beige/60">
        {isUrl(value) ? <img src={sizedImage(value, 120)} alt="" className="size-full object-cover" /> : <ImageOff className="size-4 text-muted" />}
      </div>
      <FormField label={label} error={error} hint={hint} className="flex-1">
        {(props) => <input {...props} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />}
      </FormField>
    </div>
  );
}

function ImageList({ label, hint, values, onChange, max, error }) {
  return (
    <div>
      <p className="label">{label}</p>
      {hint && <p className="-mt-1 mb-3 text-xs text-muted">{hint}</p>}
      {error && <p className="mb-2 text-xs text-red-700">{error}</p>}
      <ul className="space-y-3">
        {values.map((url, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-beige/60">
              {isUrl(url) ? <img src={sizedImage(url, 100)} alt="" className="size-full object-cover" /> : <ImageOff className="size-4 text-muted" />}
            </div>
            <input
              value={url}
              onChange={(e) => onChange(values.map((u, idx) => (idx === i ? e.target.value : u)))}
              placeholder="https://…"
              className="input flex-1"
              aria-label={`${label} ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
              aria-label="Remove image"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {values.length < max && (
        <Button type="button" size="sm" variant="light" className="mt-3" onClick={() => onChange([...values, ''])}>
          <Plus className="size-4" aria-hidden /> Add image
        </Button>
      )}
    </div>
  );
}

export default function Settings() {
  const { data, loading, error } = useApi('/settings');
  const { setSettings } = useSettings();
  const { notify } = useToast();
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const s = data.settings;
    setValues({
      brandName: s.brandName || '',
      brandDescription: s.brandDescription || '',
      contactEmail: s.contactEmail || '',
      announcement: s.announcement || '',
      social: { instagram: '', facebook: '', etsy: '', website: '', ...s.social },
      images: { hero: [], story: '', custom: '', banner: '', instagram: [], ...s.images },
      orders: {
        enabled: Boolean(s.orders?.enabled),
        shippingFlatRate: String(s.orders?.shippingFlatRate ?? 0),
        freeShippingOver: String(s.orders?.freeShippingOver ?? 0),
      },
    });
  }, [data]);

  if (loading || (!values && !error)) return <PageLoader />;
  if (error) return <Alert type="error">{error}</Alert>;

  const set = (path, value) => {
    setValues((v) => {
      const [group, key] = path.split('.');
      return key ? { ...v, [group]: { ...v[group], [key]: value } } : { ...v, [group]: value };
    });
    setErrors((e) => ({ ...e, [path]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (values.brandName.trim().length < 2) found.brandName = 'Please enter the brand name.';
    if (values.contactEmail && !isEmail(values.contactEmail)) found.contactEmail = 'Please enter a valid email.';
    if (values.announcement.length > 160) found.announcement = 'Keep the announcement to 160 characters.';
    for (const key of ['instagram', 'facebook', 'etsy', 'website']) {
      if (values.social[key] && !isUrl(values.social[key])) found[`social.${key}`] = 'Must be a full URL starting with https://';
    }
    for (const key of ['story', 'custom', 'banner']) {
      if (values.images[key] && !isUrl(values.images[key])) found[`images.${key}`] = 'Must be a full URL starting with https://';
    }
    if (values.images.hero.some((u) => u.trim() && !isUrl(u))) found['images.hero'] = 'Each hero image must be a full https:// URL.';
    if (values.images.instagram.some((u) => u.trim() && !isUrl(u))) found['images.instagram'] = 'Each gallery image must be a full https:// URL.';
    const flat = Number(values.orders.shippingFlatRate);
    const freeOver = Number(values.orders.freeShippingOver);
    if (values.orders.shippingFlatRate === '' || !Number.isFinite(flat) || flat < 0 || flat > 100) {
      found['orders.shippingFlatRate'] = 'Enter an amount between £0 and £100.';
    }
    if (values.orders.freeShippingOver === '' || !Number.isFinite(freeOver) || freeOver < 0 || freeOver > 10000) {
      found['orders.freeShippingOver'] = 'Enter 0 to turn this off, or an amount up to £10,000.';
    }
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        images: {
          ...values.images,
          hero: values.images.hero.map((u) => u.trim()).filter(Boolean),
          instagram: values.images.instagram.map((u) => u.trim()).filter(Boolean),
        },
        orders: {
          enabled: values.orders.enabled,
          shippingFlatRate: Math.round(flat * 100) / 100,
          freeShippingOver: Math.round(freeOver * 100) / 100,
        },
      };
      const { data: res } = await api.put('/settings', payload);
      setSettings(res.settings);
      notify('Settings saved.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title="Settings"
        description="Brand details, contact information and homepage content."
        actions={
          <Button type="submit" size="sm" loading={saving}>
            Save settings
          </Button>
        }
      />
      {message && <Alert type="error" className="mb-6">{message}</Alert>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5 p-6">
          <h2 className="text-2xl">Brand</h2>
          <FormField label="Brand name" required error={errors.brandName}>
            {(props) => <input {...props} value={values.brandName} onChange={(e) => set('brandName', e.target.value)} maxLength={80} />}
          </FormField>
          <FormField label="Brand description" hint="Shown in the footer." error={errors.brandDescription}>
            {(props) => (
              <textarea {...props} rows={3} value={values.brandDescription} onChange={(e) => set('brandDescription', e.target.value)} maxLength={600} />
            )}
          </FormField>
          <FormField label="Contact email" error={errors.contactEmail}>
            {(props) => <input {...props} type="email" value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />}
          </FormField>
          <FormField label="Homepage announcement" hint={`${values.announcement.length}/160 - shown in the bar at the top of every page.`} error={errors.announcement}>
            {(props) => <input {...props} value={values.announcement} onChange={(e) => set('announcement', e.target.value)} maxLength={160} />}
          </FormField>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="text-2xl">Social links</h2>
          {[
            ['instagram', 'Instagram'],
            ['facebook', 'Facebook'],
            ['etsy', 'Etsy shop'],
            ['website', 'Existing website'],
          ].map(([key, label]) => (
            <FormField key={key} label={label} error={errors[`social.${key}`]}>
              {(props) => <input {...props} value={values.social[key]} onChange={(e) => set(`social.${key}`, e.target.value)} placeholder="https://…" />}
            </FormField>
          ))}
        </Card>

        <Card className="space-y-5 p-6 xl:col-span-2">
          <div>
            <h2 className="text-2xl">Online ordering &amp; delivery</h2>
            <p className="mt-1 text-xs text-muted">UK delivery only. Customers pay by card through Stripe.</p>
          </div>
          {!data.settings.stripeConfigured && (
            <Alert type="warning" title="Stripe is not connected">
              Add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> to the server environment to take payments.
              Until then the bag shows a "contact us" message instead of a checkout button.
            </Alert>
          )}
          <Toggle
            checked={values.orders.enabled}
            onChange={(v) => set('orders.enabled', v)}
            label="Accept online orders"
            description="Turn off to pause checkout (for example while away). Customers can still send enquiries."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="UK delivery charge (£)" error={errors['orders.shippingFlatRate']} hint="Flat rate per order.">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  value={values.orders.shippingFlatRate}
                  onChange={(e) => set('orders.shippingFlatRate', e.target.value)}
                />
              )}
            </FormField>
            <FormField label="Free delivery over (£)" error={errors['orders.freeShippingOver']} hint="Set to 0 to never offer free delivery.">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  inputMode="decimal"
                  value={values.orders.freeShippingOver}
                  onChange={(e) => set('orders.freeShippingOver', e.target.value)}
                />
              )}
            </FormField>
          </div>
        </Card>

        <Card className="space-y-6 p-6 xl:col-span-2">
          <div>
            <h2 className="text-2xl">Homepage images</h2>
            <p className="mt-1 text-xs text-muted">Replace the demo photography with your own image URLs at any time.</p>
          </div>
          <ImageList
            label="Hero slideshow"
            hint="Large images at the top of the homepage (up to 5). Landscape photos work best."
            values={values.images.hero}
            onChange={(v) => set('images.hero', v)}
            max={5}
            error={errors['images.hero']}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <ImageInput label="Brand story image" value={values.images.story} onChange={(v) => set('images.story', v)} error={errors['images.story']} />
            <ImageInput label="Custom creation image" value={values.images.custom} onChange={(v) => set('images.custom', v)} error={errors['images.custom']} />
            <ImageInput label="Brand banner image" value={values.images.banner} onChange={(v) => set('images.banner', v)} error={errors['images.banner']} />
          </div>
          <ImageList
            label="Instagram-style gallery"
            hint="These images link to your Instagram profile. They are not a live feed."
            values={values.images.instagram}
            onChange={(v) => set('images.instagram', v)}
            max={12}
            error={errors['images.instagram']}
          />
        </Card>
      </div>
    </form>
  );
}
