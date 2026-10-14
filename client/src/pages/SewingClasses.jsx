import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Clock, Lock, Mail, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import ClassDatePicker from '../components/classes/ClassDatePicker';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { Facebook, Instagram } from '../components/ui/SocialIcons';
import {
  WEEKDAY_NAMES,
  formatClassLongDate,
  formatClassTimeRange,
  formatPrice,
  formatSlotRange,
  isEmail,
  sizedImage,
} from '../utils/format';
import { readJSON, writeJSON } from '../utils/storage';

const DETAILS_KEY = 'slfi_class_details_v1';
const PENDING_KEY = 'slfi_class_checkout_v1';
const EMPTY = { name: '', email: '', phone: '' };
const PHONE = /^[+\d][\d\s()-]{6,24}$/;

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!isEmail(v.email)) errors.email = 'Please enter a valid email address.';
  if (!PHONE.test(v.phone.trim())) errors.phone = 'Please enter a phone number so we can reach you about the class.';
  return errors;
}

function Price({ classes }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-3xl text-charcoal">{formatPrice(classes.unitPrice)}</span>
      {classes.offerApplied && classes.regularPrice > classes.unitPrice && (
        <span className="text-base text-muted line-through">{formatPrice(classes.regularPrice)}</span>
      )}
    </span>
  );
}

export default function SewingClasses() {
  useDocumentTitle(
    'Sewing Classes',
    'Basic sewing classes in Leamington Spa - learn how your sewing machine works and build confidence with the essentials.'
  );
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const { data, loading, error, reload } = useApi('/classes');
  const [selected, setSelected] = useState(null);
  const [places, setPlaces] = useState(1);
  const [values, setValues] = useState(() => ({ ...EMPTY, ...readJSON(DETAILS_KEY, {}, sessionStorage) }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const formRef = useRef(null);

  useEffect(() => writeJSON(DETAILS_KEY, values, sessionStorage), [values]);

  // Coming back from Stripe without paying: free the held places straight away.
  useEffect(() => {
    if (!params.get('cancelled')) return;
    setCancelled(true);
    setParams({}, { replace: true });
    const pending = readJSON(PENDING_KEY, null, sessionStorage);
    if (!pending?.sessionId) return;
    writeJSON(PENDING_KEY, null, sessionStorage);
    api
      .post('/classes/bookings/release', { sessionId: pending.sessionId })
      .catch(() => {})
      .finally(reload);
  }, [params, setParams, reload]);

  const classes = data?.classes;
  const sessions = useMemo(() => data?.sessions || [], [data]);

  // Keep the selection in step with fresh availability.
  useEffect(() => {
    if (!selected) return;
    const fresh = sessions.find((s) => s._id === selected._id);
    if (!fresh || fresh.status !== 'scheduled' || fresh.placesLeft <= 0) {
      setSelected(null);
    } else if (fresh !== selected) {
      setSelected(fresh);
      setPlaces((p) => Math.min(p, fresh.placesLeft));
    }
  }, [sessions, selected]);

  const choose = (session) => {
    setSelected(session);
    setPlaces((p) => Math.max(1, Math.min(p, session.placesLeft)));
    setMessage('');
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage('Please check the highlighted fields.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const { data: result } = await api.post('/classes/book', {
        sessionId: selected._id,
        places,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      });
      writeJSON(PENDING_KEY, { sessionId: result.sessionId }, sessionStorage);
      window.location.assign(result.url);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage(getErrorMessage(err));
      if (err?.response?.status === 409) reload();
      setSubmitting(false);
    }
  };

  if (loading && !data) return <PageLoader />;

  const phone = settings.contactPhone;
  const email = settings.contactEmail;
  const venue = classes?.venue || settings.classes.venue;
  const schedule = classes?.schedule || [];
  const duration = classes?.durationMinutes || 120;
  const maxPlaces = selected ? Math.min(selected.placesLeft, classes?.capacity || 1) : 1;

  return (
    <div>
      <section className="border-b border-beige bg-cream-dark">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow mb-2">Basic Sewing Class</p>
            <h1 className="text-5xl leading-tight text-charcoal">Learn sewing skills for life</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Friendly two-hour classes in small groups at {venue || 'our venue in Leamington Spa'}. Choose a date below and
              book your place online.
            </p>
            {classes && (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Price classes={classes} />
                <span className="text-sm text-muted">per person</span>
                {classes.offerApplied && (
                  <span className="rounded-full bg-terracotta px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
                    Special offer
                  </span>
                )}
              </div>
            )}
            <div className="mt-7">
              <Button href="#choose-date">
                <CalendarDays className="size-4" aria-hidden /> Choose a date
              </Button>
            </div>
          </div>
          {classes?.image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-beige">
              <img
                src={sizedImage(classes.image, 1000)}
                alt="A sewing machine ready for class"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <section aria-labelledby="getting-started">
            <h2 id="getting-started" className="text-3xl text-charcoal">
              Getting Started
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-charcoal/80">
              We begin with the basics. Learn how your sewing machine works, how to thread it, load a bobbin, and adjust
              tension. Practice stitching straight lines and learn useful stitches such as backstitch and zigzag.
            </p>
          </section>
          <section aria-labelledby="fundamentals">
            <h2 id="fundamentals" className="text-3xl text-charcoal">
              Sewing Fundamentals
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-charcoal/80">
              Build confidence with your machine while learning common sewing terminology and the essential tools every
              sewer should know.
            </p>
          </section>
          <section aria-labelledby="questions" className="rounded-sm bg-beige/60 p-6">
            <h2 id="questions" className="text-2xl text-charcoal">
              Any questions?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
              If you have any other questions please call me or email me.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta">
                    <Phone className="size-4 text-terracotta" aria-hidden /> {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-2.5 text-charcoal hover:text-terracotta">
                    <Mail className="size-4 text-terracotta" aria-hidden /> {email}
                  </a>
                </li>
              )}
              {!phone && !email && (
                <li>
                  <Button to="/contact" variant="light" size="sm">
                    Send a message
                  </Button>
                </li>
              )}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              You can also pop in to LOTT Bazaar and see Lorraine, or send a message on{' '}
              <a href={settings.social.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-terracotta hover:underline">
                <Facebook className="size-3.5" /> Facebook
              </a>{' '}
              or{' '}
              <a href={settings.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-terracotta hover:underline">
                <Instagram className="size-3.5" /> Instagram
              </a>
              .
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-sm border border-beige bg-white p-6" aria-labelledby="class-facts">
          <h2 id="class-facts" className="text-2xl text-charcoal">
            Class details
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
              <div>
                <dt className="font-medium text-charcoal">When</dt>
                {schedule.length ? (
                  schedule.map((slot) => (
                    <dd key={`${slot.weekday}-${slot.time}`} className="text-muted">
                      {WEEKDAY_NAMES[slot.weekday]}s, {formatSlotRange(slot.time, duration)}
                    </dd>
                  ))
                ) : (
                  <dd className="text-muted">Dates to be announced</dd>
                )}
                <dd className="text-muted">{duration / 60 === 2 ? 'Two hours' : `${duration} minutes`} per class</dd>
              </div>
            </div>
            {venue && (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
                <div>
                  <dt className="font-medium text-charcoal">Where</dt>
                  <dd className="text-muted">{venue}</dd>
                  <dd>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-terracotta hover:underline"
                    >
                      View on map
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {classes && (
              <div className="flex gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
                <div>
                  <dt className="font-medium text-charcoal">Group size</dt>
                  <dd className="text-muted">Up to {classes.capacity} people per class</dd>
                </div>
              </div>
            )}
          </dl>
          {classes && (
            <div className="mt-6 border-t border-beige pt-5">
              <p className="text-xs uppercase tracking-wider text-muted">Price per person</p>
              <Price classes={classes} />
            </div>
          )}
        </aside>
      </div>

      <section id="choose-date" className="scroll-mt-28 border-t border-beige bg-cream-dark/50" aria-labelledby="choose-date-heading">
        <div className="container-page py-12 sm:py-16">
          <h2 id="choose-date-heading" className="text-4xl text-charcoal">
            Choose a date
          </h2>
          <p className="mt-2 text-sm text-muted">All times are UK time. Pick a date to book your place.</p>

          <div className="mt-6 space-y-4">
            {cancelled && (
              <Alert type="info">Payment was cancelled and you have not been charged. You can choose a date and try again.</Alert>
            )}
            {error && <Alert type="error">{error}</Alert>}
            {classes && !classes.enabled && (
              <Alert type="info" title="Classes are not being booked online right now">
                Please call or email to ask about upcoming dates.
              </Alert>
            )}
            {classes?.enabled && !classes.bookingAvailable && (
              <Alert type="info" title="Online booking is not available right now">
                You can still see the dates below - please call or email to book a place.
              </Alert>
            )}
          </div>

          {classes?.enabled && (
            <div className="mt-6">
              <ClassDatePicker sessions={sessions} selectedId={selected?._id} onSelect={choose} />
            </div>
          )}

          {selected && classes?.bookingAvailable && (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 grid gap-8 rounded-sm border border-beige bg-white p-6 sm:p-8 lg:grid-cols-[1fr_320px]"
            >
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">Your class</p>
                  <p className="mt-1 text-2xl text-charcoal">{formatClassLongDate(selected.startsAt)}</p>
                  <p className="text-sm text-muted">
                    {formatClassTimeRange(selected.startsAt, selected.durationMinutes)}
                    {venue ? ` · ${venue}` : ''}
                  </p>
                </div>
                {message && <Alert type="error">{message}</Alert>}
                <FormField label="Places" required error={errors.places} hint={`${selected.placesLeft} left on this date`}>
                  {(props) => (
                    <select {...props} value={places} onChange={(e) => setPlaces(Number(e.target.value))}>
                      {Array.from({ length: maxPlaces }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'place' : 'places'}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
                <FormField label="Full name" required error={errors.name}>
                  {(props) => <input {...props} value={values.name} onChange={update('name')} autoComplete="name" maxLength={80} />}
                </FormField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Email address" required error={errors.email} hint="Your booking confirmation is shown after payment.">
                    {(props) => (
                      <input {...props} type="email" value={values.email} onChange={update('email')} autoComplete="email" maxLength={120} />
                    )}
                  </FormField>
                  <FormField label="Phone" required error={errors.phone} hint="In case we need to contact you about the class.">
                    {(props) => <input {...props} type="tel" value={values.phone} onChange={update('phone')} autoComplete="tel" maxLength={30} />}
                  </FormField>
                </div>
              </div>

              <div className="flex flex-col justify-end gap-4 rounded-sm bg-cream-dark/60 p-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">
                    {places} × {formatPrice(classes.unitPrice)}
                  </span>
                  <span className="text-2xl text-charcoal">{formatPrice(classes.unitPrice * places)}</span>
                </div>
                <Button type="submit" size="lg" className="w-full" loading={submitting}>
                  {!submitting && <Lock className="size-4" aria-hidden />} Buy now - {formatPrice(classes.unitPrice * places)}
                </Button>
                <p className="flex gap-2 text-xs leading-relaxed text-muted">
                  <ShieldCheck className="size-4 shrink-0 text-forest" aria-hidden />
                  Your places are held for 30 minutes while you pay on Stripe's secure page.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
