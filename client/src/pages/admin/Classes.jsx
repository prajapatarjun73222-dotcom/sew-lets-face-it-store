import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, Mail, Plus, Trash2, Users } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { PageHeader, Card, ConfirmDialog, StatusBadge, Toggle } from '../../components/admin/AdminUI';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner, { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  WEEKDAY_NAMES,
  formatClassDay,
  formatClassLongDate,
  formatClassTimeRange,
  formatDateTime,
  formatPrice,
} from '../../utils/format';

const BOOKING_LABELS = {
  pending_payment: ['Awaiting payment', 'amber'],
  paid: ['Paid', 'green'],
  cancelled: ['Cancelled', 'red'],
  refunded: ['Refunded', 'neutral'],
};

const isUrl = (v) => /^https?:\/\/\S+$/i.test(String(v).trim());

function stripeLink(booking) {
  if (!booking.stripePaymentIntentId) return '';
  const test = booking.stripeSessionId?.startsWith('cs_test_') ? 'test/' : '';
  return `https://dashboard.stripe.com/${test}payments/${booking.stripePaymentIntentId}`;
}

function toForm(classes) {
  return {
    enabled: Boolean(classes.enabled),
    regularPrice: String(classes.regularPrice ?? ''),
    offerPrice: String(classes.offerPrice ?? ''),
    offerActive: Boolean(classes.offerActive),
    capacity: String(classes.capacity ?? ''),
    weeksAhead: String(classes.weeksAhead ?? ''),
    durationMinutes: String(classes.durationMinutes ?? ''),
    schedule: (classes.schedule || []).map(({ weekday, time }) => ({ weekday, time })),
    venue: classes.venue || '',
    image: classes.image || '',
  };
}

function ClassSettings({ settings, stripeConfigured, onSaved }) {
  const { notify } = useToast();
  const [values, setValues] = useState(() => toForm(settings));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(toForm(settings)), [settings]);

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setSlot = (index, changes) => set('schedule', values.schedule.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    const num = (key, min, max, label, integer = false) => {
      const n = Number(values[key]);
      if (values[key] === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) found[key] = label;
      return n;
    };
    const regularPrice = num('regularPrice', 1, 1000, 'Enter a price between £1 and £1,000.');
    const offerPrice = num('offerPrice', 1, 1000, 'Enter a price between £1 and £1,000.');
    const capacity = num('capacity', 1, 50, 'Enter between 1 and 50 places.', true);
    const weeksAhead = num('weeksAhead', 1, 26, 'Enter between 1 and 26 weeks.', true);
    const durationMinutes = num('durationMinutes', 15, 600, 'Enter between 15 and 600 minutes.', true);
    if (values.image && !isUrl(values.image)) found.image = 'Must be a full URL starting with https://';
    if (values.schedule.some((s) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))) found.schedule = 'Each class needs a start time.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const { data } = await api.put('/settings', {
        classes: {
          enabled: values.enabled,
          regularPrice: Math.round(regularPrice * 100) / 100,
          offerPrice: Math.round(offerPrice * 100) / 100,
          offerActive: values.offerActive,
          capacity,
          weeksAhead,
          durationMinutes,
          schedule: values.schedule,
          venue: values.venue.trim(),
          image: values.image.trim(),
        },
      });
      onSaved(data.settings);
      notify('Class settings saved.');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k.replace(/^classes\./, '').replace(/^schedule.+/, 'schedule'), v])));
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const numberInput = (key, props, extra = {}) => (
    <input {...props} type="number" inputMode="decimal" value={values[key]} onChange={(e) => set(key, e.target.value)} {...extra} />
  );

  return (
    <Card className="p-6">
      <form onSubmit={save} noValidate className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl">Class settings</h2>
            <p className="mt-1 text-xs text-muted">Prices, group size and the weekly timetable. Dates are created automatically.</p>
          </div>
          <Button type="submit" size="sm" loading={saving}>
            Save class settings
          </Button>
        </div>

        {!stripeConfigured && (
          <Alert type="warning" title="Stripe is not connected">
            Customers can see the dates but will be asked to call or email to book until Stripe keys are added to the server.
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            checked={values.enabled}
            onChange={(v) => set('enabled', v)}
            label="Take class bookings online"
            description="Turn off to hide the dates and the homepage banner."
          />
          <Toggle
            checked={values.offerActive}
            onChange={(v) => set('offerActive', v)}
            label="Special offer on"
            description={`Charge the offer price (${formatPrice(Number(values.offerPrice) || 0)}) instead of the regular price.`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Regular price (£)" error={errors.regularPrice}>
            {(props) => numberInput('regularPrice', props, { min: 1, max: 1000, step: '0.01' })}
          </FormField>
          <FormField label="Offer price (£)" error={errors.offerPrice}>
            {(props) => numberInput('offerPrice', props, { min: 1, max: 1000, step: '0.01' })}
          </FormField>
          <FormField label="Places per class" error={errors.capacity} hint="Used for new and unchanged dates.">
            {(props) => numberInput('capacity', props, { min: 1, max: 50, step: 1 })}
          </FormField>
          <FormField label="Weeks to show" error={errors.weeksAhead}>
            {(props) => numberInput('weeksAhead', props, { min: 1, max: 26, step: 1 })}
          </FormField>
          <FormField label="Class length (minutes)" error={errors.durationMinutes}>
            {(props) => numberInput('durationMinutes', props, { min: 15, max: 600, step: 15 })}
          </FormField>
        </div>

        <div>
          <p className="label">Weekly class times (UK time)</p>
          {errors.schedule && <p className="mb-2 text-xs text-red-700">{errors.schedule}</p>}
          <ul className="space-y-2">
            {values.schedule.map((slot, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <select
                  className="input w-40"
                  value={slot.weekday}
                  onChange={(e) => setSlot(index, { weekday: Number(e.target.value) })}
                  aria-label="Day of the week"
                >
                  {WEEKDAY_NAMES.map((name, day) => (
                    <option key={name} value={day}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  className="input w-32"
                  value={slot.time}
                  onChange={(e) => setSlot(index, { time: e.target.value })}
                  aria-label="Start time"
                />
                <button
                  type="button"
                  onClick={() => set('schedule', values.schedule.filter((_, i) => i !== index))}
                  className="rounded-sm p-2 text-muted hover:bg-red-50 hover:text-red-700"
                  aria-label="Remove class time"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {values.schedule.length < 14 && (
            <Button
              type="button"
              size="sm"
              variant="light"
              className="mt-3"
              onClick={() => set('schedule', [...values.schedule, { weekday: 1, time: '18:00' }])}
            >
              <Plus className="size-4" aria-hidden /> Add a weekly time
            </Button>
          )}
          <p className="mt-2 text-xs text-muted">
            Removing a time only removes future dates that nobody has booked. Booked dates stay until you cancel them below.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Venue" error={errors.venue}>
            {(props) => <input {...props} value={values.venue} onChange={(e) => set('venue', e.target.value)} maxLength={200} />}
          </FormField>
          <FormField label="Class image URL" error={errors.image}>
            {(props) => <input {...props} value={values.image} onChange={(e) => set('image', e.target.value)} placeholder="https://…" />}
          </FormField>
        </div>
      </form>
    </Card>
  );
}

function AddDate({ onAdded }) {
  const { notify } = useToast();
  const [values, setValues] = useState({ date: '', time: '18:00', capacity: '', note: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!values.date) found.date = 'Choose a date.';
    if (!values.time) found.time = 'Choose a start time.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const { data } = await api.post('/admin/classes/sessions', {
        date: values.date,
        time: values.time,
        ...(values.capacity ? { capacity: Number(values.capacity) } : {}),
        note: values.note.trim(),
      });
      notify('Extra date added.');
      setValues((v) => ({ ...v, date: '', note: '' }));
      onAdded(data.session);
    } catch (err) {
      setErrors(getFieldErrors(err));
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-t border-beige p-4">
      <p className="text-sm font-medium">Add an extra date</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" error={errors.date}>
          {(props) => <input {...props} type="date" value={values.date} onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))} />}
        </FormField>
        <FormField label="Start (UK)" error={errors.time}>
          {(props) => <input {...props} type="time" value={values.time} onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))} />}
        </FormField>
        <FormField label="Places" hint="Blank = default" error={errors.capacity}>
          {(props) => (
            <input {...props} type="number" min="1" max="50" value={values.capacity} onChange={(e) => setValues((v) => ({ ...v, capacity: e.target.value }))} />
          )}
        </FormField>
        <FormField label="Note" error={errors.note}>
          {(props) => <input {...props} value={values.note} maxLength={300} onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))} />}
        </FormField>
      </div>
      <Button type="submit" size="sm" variant="light" loading={saving}>
        <Plus className="size-4" aria-hidden /> Add date
      </Button>
    </form>
  );
}

function BookingRow({ booking, onUpdated }) {
  const { notify } = useToast();
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(booking.adminNotes || '');
  const [label, tone] = BOOKING_LABELS[booking.status] || [booking.status, 'neutral'];
  const paymentUrl = stripeLink(booking);

  const update = async (changes, message) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/classes/bookings/${booking._id}`, changes);
      onUpdated(data.booking);
      notify(message);
      setConfirm(null);
      setEditingNote(false);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const canCancel = booking.status === 'paid' || booking.status === 'pending_payment';
  const canRefund = booking.status === 'paid' || (booking.status === 'cancelled' && booking.paidAt);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-charcoal">
            {booking.name} <span className="text-sm font-normal text-muted">· {booking.places} {booking.places === 1 ? 'place' : 'places'}</span>
          </p>
          <p className="text-sm">
            <a href={`mailto:${booking.email}`} className="text-terracotta hover:underline">
              {booking.email}
            </a>
            {booking.phone && (
              <>
                {' · '}
                <a href={`tel:${booking.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                  {booking.phone}
                </a>
              </>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {booking.bookingNumber} · {formatPrice(booking.total)}
            {booking.offerApplied && ' (offer price)'}
            {booking.paidAt ? ` · Paid ${formatDateTime(booking.paidAt)}` : ` · Started ${formatDateTime(booking.createdAt)}`}
          </p>
        </div>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>

      {booking.capacityIssue && (
        <Alert type="warning" className="mt-3">
          This payment arrived after the place hold had expired and the class was already full. Please contact the customer.
        </Alert>
      )}
      {booking.adminNotes && !editingNote && <p className="mt-2 whitespace-pre-line rounded-sm bg-cream p-2 text-xs text-charcoal/80">{booking.adminNotes}</p>}
      {editingNote && (
        <div className="mt-2">
          <textarea
            className="input"
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Private note"
            placeholder="Only visible to admins"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="light" loading={saving} onClick={() => update({ adminNotes: note }, 'Note saved.')}>
              Save note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingNote(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!editingNote && (
          <button type="button" onClick={() => setEditingNote(true)} className="rounded-sm border border-beige-dark px-3 py-1.5 text-xs hover:border-charcoal">
            {booking.adminNotes ? 'Edit note' : 'Add note'}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setConfirm('cancelled')}
            className="rounded-sm border border-red-200 px-3 py-1.5 text-xs text-red-800 hover:border-red-400 disabled:opacity-50"
          >
            Cancel booking
          </button>
        )}
        {canRefund && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setConfirm('refunded')}
            className="rounded-sm border border-red-200 px-3 py-1.5 text-xs text-red-800 hover:border-red-400 disabled:opacity-50"
          >
            Mark refunded
          </button>
        )}
        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-sm border border-beige-dark px-3 py-1.5 text-xs hover:border-charcoal"
          >
            <ExternalLink className="size-3.5" aria-hidden /> Stripe payment
          </a>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === 'refunded' ? 'Mark this booking as refunded?' : 'Cancel this booking?'}
        confirmLabel={confirm === 'refunded' ? 'Mark refunded' : 'Cancel booking'}
        cancelLabel="Keep booking"
        onCancel={() => setConfirm(null)}
        onConfirm={() => update({ status: confirm }, confirm === 'refunded' ? 'Booking marked as refunded.' : 'Booking cancelled.')}
        loading={saving}
      >
        <p>
          {booking.placesHeld !== false && booking.status !== 'cancelled'
            ? `The ${booking.places === 1 ? 'place' : `${booking.places} places`} will be released for other customers. `
            : ''}
          {booking.paidAt
            ? 'This does not move any money - issue the refund from the Stripe dashboard (use "Stripe payment").'
            : 'This booking has not been paid, so no refund is needed.'}
        </p>
      </ConfirmDialog>
    </li>
  );
}

function SessionDetail({ sessionId, onSessionChanged, onBack }) {
  const { notify } = useToast();
  const { data, loading, error, setData, reload } = useApi(`/admin/classes/sessions/${sessionId}/bookings`);
  const [capacity, setCapacity] = useState('');
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [saving, setSaving] = useState(false);

  const session = data?.session;
  const bookings = data?.bookings || [];

  useEffect(() => {
    if (!session) return;
    setCapacity(String(session.capacity));
    setNote(session.note || '');
  }, [session]);

  if (loading && !data) {
    return (
      <Card className="flex min-h-60 items-center justify-center p-10">
        <Spinner label="Loading date…" />
      </Card>
    );
  }
  if (error) return <Alert type="error">{error}</Alert>;
  if (!session) return null;

  const paid = bookings.filter((b) => b.status === 'paid');
  const paidPlaces = paid.reduce((sum, b) => sum + b.places, 0);
  const isPast = new Date(session.startsAt) <= new Date();
  const emails = [...new Set(paid.map((b) => b.email))];
  const mailAll = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${encodeURIComponent(
    `Sewing class on ${formatClassLongDate(session.startsAt)}`
  )}`;

  const patch = async (changes, message) => {
    setSaving(true);
    try {
      const { data: res } = await api.patch(`/admin/classes/sessions/${session._id}`, changes);
      setData((d) => ({ ...d, session: res.session }));
      onSessionChanged(res.session);
      notify(message);
      setConfirmCancel(false);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onBookingUpdated = (booking) => {
    setData((d) => ({ ...d, bookings: d.bookings.map((b) => (b._id === booking._id ? booking : b)) }));
    reload();
    onSessionChanged();
  };

  return (
    <Card className="p-6">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-terracotta lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Back to dates
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl">{formatClassLongDate(session.startsAt)}</h2>
          <p className="mt-1 text-sm text-muted">{formatClassTimeRange(session.startsAt, session.durationMinutes)} (UK time)</p>
        </div>
        {session.status === 'cancelled' ? (
          <StatusBadge tone="red">Cancelled</StatusBadge>
        ) : isPast ? (
          <StatusBadge>Finished</StatusBadge>
        ) : session.placesLeft <= 0 ? (
          <StatusBadge tone="terracotta">Fully booked</StatusBadge>
        ) : (
          <StatusBadge tone="green">Open</StatusBadge>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-beige py-4 text-center text-sm">
        <div>
          <dt className="text-xs text-muted uppercase">Paid places</dt>
          <dd className="mt-1 text-2xl">{paidPlaces}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Being paid</dt>
          <dd className="mt-1 text-2xl">{Math.max(0, session.placesTaken - paidPlaces)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Places left</dt>
          <dd className="mt-1 text-2xl">{session.status === 'cancelled' ? 0 : session.placesLeft}</dd>
        </div>
      </dl>

      {!isPast && (
        <div className="mt-5 grid gap-4 sm:grid-cols-[140px_auto_1fr_auto] sm:items-end">
          <FormField label="Places">
            {(props) => <input {...props} type="number" min={session.placesTaken} max="50" value={capacity} onChange={(e) => setCapacity(e.target.value)} />}
          </FormField>
          <Button
            size="sm"
            variant="light"
            disabled={saving || capacity === String(session.capacity) || capacity === ''}
            onClick={() => patch({ capacity: Number(capacity) }, 'Places updated.')}
          >
            Save places
          </Button>
          <FormField label="Note shown to customers">
            {(props) => <input {...props} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bring your own machine" />}
          </FormField>
          <Button size="sm" variant="light" disabled={saving || note === (session.note || '')} onClick={() => patch({ note: note.trim() }, 'Note saved.')}>
            Save note
          </Button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {emails.length > 0 && (
          <Button href={mailAll} size="sm">
            <Mail className="size-4" aria-hidden /> Email all attendees
          </Button>
        )}
        {!isPast &&
          (session.status === 'cancelled' ? (
            <Button size="sm" variant="light" loading={saving} onClick={() => patch({ status: 'scheduled' }, 'Date reopened.')}>
              Reopen this date
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmCancel(true)}>
              Cancel this date
            </Button>
          ))}
      </div>

      <div className="mt-6 border-t border-beige pt-4">
        <h3 className="text-xl">Attendees</h3>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-beige">
            {bookings.map((booking) => (
              <BookingRow key={booking._id} booking={booking} onUpdated={onBookingUpdated} />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this class date?"
        confirmLabel="Cancel date"
        cancelLabel="Keep date"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => patch({ status: 'cancelled' }, 'Date cancelled.')}
        loading={saving}
      >
        <p>Customers will see this date as cancelled and won't be able to book it.</p>
        {paid.length > 0 && (
          <p className="mt-3 font-medium text-red-800">
            {paid.length} {paid.length === 1 ? 'person has' : 'people have'} already paid for this date. Their bookings are not
            cancelled automatically - please contact them (use "Email all attendees") and cancel or refund each booking.
          </p>
        )}
      </ConfirmDialog>
    </Card>
  );
}

export default function Classes() {
  const [params, setParams] = useSearchParams();
  const range = params.get('range') === 'past' ? 'past' : 'upcoming';
  const selectedId = params.get('id');
  const { setSettings } = useSettings();
  const { data: settingsData, loading: settingsLoading, setData: setSettingsData } = useApi('/settings');
  const { data, loading, error, reload, setData } = useApi('/admin/classes/sessions', { params: { range } });
  const sessions = data?.sessions || [];

  const setParam = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const onSessionChanged = (session) => {
    if (session) {
      setData((d) => d && { ...d, sessions: d.sessions.map((s) => (s._id === session._id ? { ...s, ...session } : s)) });
    }
    reload();
  };

  if (settingsLoading && !settingsData) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Classes"
        description="Sewing class dates, places and attendees. Payments and refunds are handled in Stripe."
        actions={
          <Button to="/sewing-classes" size="sm" variant="light" target="_blank">
            <ExternalLink className="size-4" aria-hidden /> View classes page
          </Button>
        }
      />

      {settingsData?.settings && (
        <ClassSettings
          settings={settingsData.settings.classes}
          stripeConfigured={settingsData.settings.stripeConfigured}
          onSaved={(saved) => {
            setSettingsData({ settings: saved });
            setSettings(saved);
            reload();
          }}
        />
      )}

      <div className="mt-6 mb-4 flex gap-2">
        {[
          ['upcoming', 'Upcoming dates'],
          ['past', 'Past dates'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setParam({ range: value === 'past' ? 'past' : '', id: '' })}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              range === value ? 'border-forest bg-forest text-cream' : 'border-beige-dark bg-white hover:border-forest'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className={`h-fit overflow-hidden ${selectedId ? 'hidden lg:block' : ''}`}>
          {loading && !data ? (
            <div className="py-16 text-center text-terracotta">
              <Spinner label="Loading dates…" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState icon={CalendarDays} title={range === 'past' ? 'No past dates' : 'No upcoming dates'}>
              {range === 'past' ? 'Finished classes will appear here.' : 'Add weekly class times above, or add an extra date below.'}
            </EmptyState>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-beige overflow-y-auto">
              {sessions.map((s) => {
                const cancelled = s.status === 'cancelled';
                return (
                  <li key={s._id}>
                    <button
                      type="button"
                      onClick={() => setParam({ id: s._id })}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-cream ${s._id === selectedId ? 'bg-beige/40' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${cancelled ? 'text-muted line-through' : ''}`}>
                          {formatClassDay(s.startsAt)} · {formatClassTimeRange(s.startsAt, s.durationMinutes)}
                        </span>
                        {cancelled ? (
                          <StatusBadge tone="red">Cancelled</StatusBadge>
                        ) : s.placesLeft <= 0 ? (
                          <StatusBadge tone="terracotta">Full</StatusBadge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Users className="size-3.5" aria-hidden />
                        {s.paidPlaces}/{s.capacity} booked
                        {s.pendingPlaces > 0 && ` · ${s.pendingPlaces} being paid`}
                        {s.source === 'extra' && ' · extra date'}
                        {s.note && ` · ${s.note}`}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {range === 'upcoming' && <AddDate onAdded={(session) => { reload(); setParam({ id: session._id }); }} />}
        </Card>

        <div>
          {selectedId ? (
            <SessionDetail key={selectedId} sessionId={selectedId} onSessionChanged={onSessionChanged} onBack={() => setParam({ id: '' })} />
          ) : (
            <Card className="hidden h-full min-h-60 items-center justify-center p-10 text-center text-sm text-muted lg:flex">
              Select a date to see who's booked.
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
