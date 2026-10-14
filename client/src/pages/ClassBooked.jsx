import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { formatClassLongDate, formatClassTimeRange, formatPrice } from '../utils/format';
import { writeJSON } from '../utils/storage';

const POLL_MS = 2500;
const MAX_POLLS = 8;

export default function ClassBooked() {
  useDocumentTitle('Class Booking Confirmation');
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const { settings } = useSettings();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    api
      .get(`/classes/bookings/confirmation/${encodeURIComponent(sessionId)}`)
      .then(({ data }) => active && setBooking(data.booking))
      .catch((err) => active && setError(getErrorMessage(err, 'We could not load your booking.')));
    return () => {
      active = false;
    };
  }, [sessionId, polls]);

  useEffect(() => {
    if (!booking || booking.status !== 'pending_payment' || polls >= MAX_POLLS) return undefined;
    const timer = setTimeout(() => setPolls((p) => p + 1), POLL_MS);
    return () => clearTimeout(timer);
  }, [booking, polls]);

  useEffect(() => {
    if (booking?.status === 'paid') writeJSON('slfi_class_checkout_v1', null, sessionStorage);
  }, [booking]);

  if (!sessionId) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Alert type="error" title="Missing booking reference">
          We couldn't tell which booking to show. If you have paid, please get in touch and we'll confirm your place.
        </Alert>
        <Button to="/sewing-classes" className="mt-6">
          Sewing Classes
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Alert type="error" title="We couldn't load your booking">
          {error} If you were charged, please contact us and we'll sort it out straight away.
        </Alert>
        <Button to="/contact" className="mt-6">
          Contact Us
        </Button>
      </div>
    );
  }

  if (!booking) return <PageLoader />;

  const isPaid = booking.status === 'paid';
  const rows = [
    ['Booking number', booking.bookingNumber],
    ['Date', formatClassLongDate(booking.sessionStartsAt)],
    ['Time', `${formatClassTimeRange(booking.sessionStartsAt, booking.durationMinutes)} (UK time)`],
    ['Venue', booking.venue],
    ['Name', booking.name],
    ['Places', booking.places],
    ['Amount', formatPrice(booking.total)],
  ].filter(([, value]) => value !== '' && value !== undefined && value !== null);

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      {isPaid ? (
        <>
          <CheckCircle2 className="size-10 text-forest" aria-hidden />
          <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">You're booked in!</h1>
          <p className="mt-3 leading-relaxed text-muted">
            Thank you - your payment was successful and your {booking.places === 1 ? 'place is' : 'places are'} confirmed. Please keep your booking number{' '}
            <strong className="text-charcoal">{booking.bookingNumber}</strong>. We'll contact you at {booking.email} if
            anything changes.
          </p>
        </>
      ) : booking.status === 'pending_payment' ? (
        <>
          <Clock className="size-10 text-terracotta" aria-hidden />
          <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">Confirming your payment…</h1>
          <p className="mt-3 leading-relaxed text-muted">
            {polls >= MAX_POLLS
              ? `This is taking longer than usual. Please refresh shortly, or contact us with booking number ${booking.bookingNumber} if you were charged.`
              : 'This usually only takes a few seconds. Please keep this page open.'}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl text-charcoal sm:text-5xl">Booking {booking.bookingNumber}</h1>
          <p className="mt-3 text-muted">
            {booking.status === 'refunded'
              ? 'This booking has been cancelled and refunded.'
              : 'This booking was not completed. If you were not charged, no further action is needed.'}
          </p>
        </>
      )}

      <dl className="mt-8 divide-y divide-beige rounded-sm border border-beige bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium text-charcoal">{value}</dd>
          </div>
        ))}
      </dl>

      {isPaid && (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          If you have any questions before the class, please{' '}
          {settings.contactPhone ? (
            <>
              call <a href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`} className="text-terracotta hover:underline">{settings.contactPhone}</a> or{' '}
            </>
          ) : null}
          {settings.contactEmail ? (
            <>
              email <a href={`mailto:${settings.contactEmail}`} className="text-terracotta hover:underline">{settings.contactEmail}</a>.
            </>
          ) : (
            <>
              <Link to="/contact" className="text-terracotta hover:underline">send us a message</Link>.
            </>
          )}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button to="/sewing-classes">{isPaid ? 'Book another date' : 'Choose a date'}</Button>
        <Button to="/shop" variant="light">
          Browse the Shop
        </Button>
      </div>
    </div>
  );
}
