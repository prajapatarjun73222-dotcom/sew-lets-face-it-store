import ClassSession from '../models/ClassSession.js';
import ClassBooking from '../models/ClassBooking.js';
import Setting from '../models/Setting.js';
import { getStripe } from '../config/stripe.js';
import { ApiError } from '../utils/ApiError.js';
import { UK_TIME_ZONE } from '../utils/ukTime.js';
import { clientBaseUrl } from './orderController.js';
import { toPence } from '../services/orderService.js';
import {
  classPrice,
  ensureUpcomingSessions,
  releaseStaleHolds,
  createPendingBooking,
  finalizePaidBooking,
  cancelPendingBooking,
  releaseBookingPlaces,
} from '../services/classService.js';

const SESSION_TTL_SECONDS = 30 * 60;

const classDateLabel = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

function classSummary(classSettings) {
  const { unitPrice, regularPrice, offerApplied } = classPrice(classSettings);
  return {
    enabled: classSettings.enabled,
    bookingAvailable: Boolean(classSettings.enabled && getStripe()),
    unitPrice,
    regularPrice,
    offerApplied,
    capacity: classSettings.capacity,
    durationMinutes: classSettings.durationMinutes,
    schedule: classSettings.schedule.map(({ weekday, time }) => ({ weekday, time })),
    venue: classSettings.venue,
    image: classSettings.image,
  };
}

export async function listClasses(_req, res) {
  const settings = await Setting.getSingleton();
  const summary = classSummary(settings.classes);
  if (!settings.classes.enabled) return res.json({ classes: summary, sessions: [] });

  await releaseStaleHolds();
  await ensureUpcomingSessions(settings.classes);
  const sessions = await ClassSession.find({ startsAt: { $gt: new Date() } })
    .sort({ startsAt: 1 })
    .limit(200);
  return res.json({ classes: summary, sessions: sessions.map((s) => s.toPublicJSON()) });
}

export async function bookClass(req, res) {
  const stripe = getStripe();
  const settings = await Setting.getSingleton();
  if (!stripe || !settings.classes.enabled) {
    throw new ApiError(503, 'Online class booking is currently unavailable. Please call or email to book a place.');
  }

  const { sessionId, places, name, email, phone } = req.body;
  if (places > settings.classes.capacity) {
    throw ApiError.badRequest('Please check the form', {
      places: `You can book up to ${settings.classes.capacity} places at a time.`,
    });
  }

  await releaseStaleHolds();
  const booking = await createPendingBooking({ sessionId, places, name, email, phone, classSettings: settings.classes });
  const baseUrl = clientBaseUrl(req);
  const when = classDateLabel(booking.sessionStartsAt);

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      customer_email: booking.email,
      client_reference_id: String(booking._id),
      metadata: { type: 'class_booking', bookingId: String(booking._id), bookingNumber: booking.bookingNumber },
      payment_intent_data: {
        description: `Sewing class booking ${booking.bookingNumber}`,
        metadata: { type: 'class_booking', bookingId: String(booking._id), bookingNumber: booking.bookingNumber },
      },
      line_items: [
        {
          quantity: booking.places,
          price_data: {
            currency: 'gbp',
            unit_amount: toPence(booking.unitPrice),
            product_data: {
              name: `Basic Sewing Class - ${when}`,
              description: [`${booking.durationMinutes / 60} hour class`, booking.venue].filter(Boolean).join(' at ').slice(0, 500),
              ...(settings.classes.image ? { images: [settings.classes.image] } : {}),
            },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      success_url: `${baseUrl}/sewing-classes/booked?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/sewing-classes?cancelled=1`,
    });
  } catch (error) {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    await releaseBookingPlaces(booking._id);
    console.error('Stripe class checkout failed:', error.message);
    throw new ApiError(502, 'We could not start the secure payment page. Please try again in a moment.');
  }

  booking.stripeSessionId = session.id;
  await booking.save();
  res.status(201).json({ url: session.url, sessionId: session.id, bookingNumber: booking.bookingNumber });
}

export async function getBookingConfirmation(req, res) {
  const { sessionId } = req.params;
  let booking = await ClassBooking.findOne({ stripeSessionId: sessionId });
  if (!booking) throw ApiError.notFound('We could not find that booking.');

  const stripe = getStripe();
  if (booking.status === 'pending_payment' && stripe) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    booking = (await finalizePaidBooking(session)) || booking;
  }
  res.json({ booking: booking.toPublicJSON() });
}

/** Called when a customer backs out of Stripe, so their places are freed straight away. */
export async function releaseBooking(req, res) {
  const { sessionId } = req.body;
  const booking = await ClassBooking.findOne({ stripeSessionId: sessionId, status: 'pending_payment' });
  const stripe = getStripe();
  if (!booking || !stripe) return res.json({ released: false });

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status === 'open') session = await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error('Could not expire class checkout session:', error.message);
    return res.json({ released: false });
  }
  if (session.status === 'complete') {
    await finalizePaidBooking(session);
    return res.json({ released: false });
  }
  const cancelled = await cancelPendingBooking(session);
  return res.json({ released: Boolean(cancelled) });
}
