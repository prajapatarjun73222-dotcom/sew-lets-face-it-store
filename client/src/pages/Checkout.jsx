import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSyncBag from '../hooks/useSyncBag';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { OrderTotals } from '../components/orders/OrderSummary';
import { formatPrice, isEmail, shippingFor, sizedImage } from '../utils/format';
import { readJSON, writeJSON } from '../utils/storage';

const DETAILS_KEY = 'slfi_checkout_details_v1';
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const EMPTY = { name: '', email: '', phone: '', line1: '', line2: '', city: '', county: '', postcode: '' };

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!isEmail(v.email)) errors.email = 'Please enter a valid email address.';
  if (v.phone.trim() && !/^[+\d][\d\s()-]{6,24}$/.test(v.phone.trim())) errors.phone = 'Please enter a valid phone number.';
  if (v.line1.trim().length < 2) errors.line1 = 'Please enter the first line of your address.';
  if (v.city.trim().length < 2) errors.city = 'Please enter your town or city.';
  if (!UK_POSTCODE.test(v.postcode.trim())) errors.postcode = 'Please enter a valid UK postcode.';
  return errors;
}

/** Server errors arrive as "address.line1"; the form uses flat field names. */
function mapServerErrors(errors) {
  const mapped = {};
  for (const [key, message] of Object.entries(errors)) mapped[key.replace(/^address\./, '')] = message;
  return mapped;
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const [params] = useSearchParams();
  const { items, subtotal } = useCart();
  const { settings, loading: settingsLoading } = useSettings();
  const { checking, recheck } = useSyncBag();
  const [values, setValues] = useState(() => ({ ...EMPTY, ...readJSON(DETAILS_KEY, {}, sessionStorage) }));
  const [errors, setErrors] = useState({});
  const [itemProblems, setItemProblems] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => writeJSON(DETAILS_KEY, values, sessionStorage), [values]);

  if (!items.length) return <Navigate to="/bag" replace />;
  if (settingsLoading) return <PageLoader />;

  if (!settings.checkoutAvailable) {
    return (
      <div className="container-page max-w-2xl py-14">
        <h1 className="text-4xl text-charcoal">Checkout</h1>
        <Alert type="info" className="mt-6" title="Online checkout is not available right now">
          Please contact us to order the items in your bag - we'll be happy to help.
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/contact">Contact Us</Button>
          <Button to="/bag" variant="light">
            Back to Bag
          </Button>
        </div>
      </div>
    );
  }

  const shipping = shippingFor(subtotal, settings.orders);
  const hasUnavailable = items.some((i) => i.stock <= 0);

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setItemProblems({});
    if (Object.keys(found).length) {
      setMessage('Please check the highlighted fields.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await api.post('/orders/checkout', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant || '',
          personalisation: i.personalisation || '',
        })),
        email: values.email.trim(),
        name: values.name.trim(),
        phone: values.phone.trim(),
        address: {
          line1: values.line1.trim(),
          line2: values.line2.trim(),
          city: values.city.trim(),
          county: values.county.trim(),
          postcode: values.postcode.trim(),
        },
      });
      window.location.assign(data.url);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (error?.response?.status === 409) {
        setItemProblems(fieldErrors);
        recheck();
      } else {
        setErrors(mapServerErrors(fieldErrors));
      }
      setMessage(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const input = (field, props, extra = {}) => (
    <input {...props} value={values[field]} onChange={update(field)} {...extra} />
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <Link to="/bag" className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Back to Bag
      </Link>
      <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">Checkout</h1>

      {params.get('cancelled') && (
        <Alert type="info" className="mt-6">
          Payment was cancelled and you have not been charged. Your bag is saved - you can try again whenever you're ready.
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          {message && <Alert type="error">{message}</Alert>}

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl text-charcoal">Your details</legend>
            <FormField label="Full name" required error={errors.name}>
              {(props) => input('name', props, { autoComplete: 'name', maxLength: 80 })}
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Email address" required error={errors.email} hint="We'll send your receipt here.">
                {(props) => input('email', props, { type: 'email', autoComplete: 'email', maxLength: 120 })}
              </FormField>
              <FormField label="Phone" error={errors.phone} hint="Optional - only used if there's a delivery question.">
                {(props) => input('phone', props, { type: 'tel', autoComplete: 'tel', maxLength: 30 })}
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl text-charcoal">Delivery address</legend>
            <p className="-mt-2 text-sm text-muted">We currently deliver within the United Kingdom only.</p>
            <FormField label="Address line 1" required error={errors.line1}>
              {(props) => input('line1', props, { autoComplete: 'address-line1', maxLength: 120 })}
            </FormField>
            <FormField label="Address line 2" error={errors.line2}>
              {(props) => input('line2', props, { autoComplete: 'address-line2', maxLength: 120 })}
            </FormField>
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Town / city" required error={errors.city}>
                {(props) => input('city', props, { autoComplete: 'address-level2', maxLength: 80 })}
              </FormField>
              <FormField label="County" error={errors.county}>
                {(props) => input('county', props, { autoComplete: 'address-level1', maxLength: 80 })}
              </FormField>
              <FormField label="Postcode" required error={errors.postcode}>
                {(props) => input('postcode', props, { autoComplete: 'postal-code', maxLength: 10, className: `${props.className} uppercase` })}
              </FormField>
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-sm border border-beige bg-white p-6 lg:sticky lg:top-28" aria-labelledby="checkout-summary">
          <h2 id="checkout-summary" className="text-2xl text-charcoal">
            Order Summary
          </h2>
          {checking && <p className="mt-1 text-xs text-muted">Checking latest prices and availability…</p>}
          <ul className="mt-4 divide-y divide-beige border-y border-beige">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 py-3 text-sm">
                {item.image ? (
                  <img src={sizedImage(item.image, 120)} alt="" className="h-16 w-12 shrink-0 rounded-sm object-cover" />
                ) : (
                  <div className="h-16 w-12 shrink-0 rounded-sm bg-beige/60" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-charcoal">{item.name}</p>
                  {item.variant && <p className="text-xs text-muted">Option: {item.variant}</p>}
                  {item.personalisation && <p className="text-xs text-muted">“{item.personalisation}”</p>}
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                  {(itemProblems[item.productId] || item.stock <= 0) && (
                    <p className="mt-1 text-xs text-red-700">{itemProblems[item.productId] || 'No longer available'}</p>
                  )}
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <OrderTotals subtotal={subtotal} shippingCost={shipping} total={subtotal + shipping} />
          </div>

          {(hasUnavailable || Object.keys(itemProblems).length > 0) && (
            <p className="mt-4 text-xs text-red-700">
              Please <Link to="/bag" className="underline">update your bag</Link> before paying.
            </p>
          )}

          <Button type="submit" className="mt-6 w-full" loading={submitting} disabled={hasUnavailable || checking}>
            {!submitting && <Lock className="size-4" aria-hidden />} Pay securely with Stripe
          </Button>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="size-4 shrink-0 text-forest" aria-hidden />
            You'll be taken to Stripe's secure page to pay. Your card details are never stored on this website.
          </p>
        </aside>
      </form>
    </div>
  );
}
