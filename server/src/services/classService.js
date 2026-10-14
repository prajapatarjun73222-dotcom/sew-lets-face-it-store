import ClassSession from '../models/ClassSession.js';
import ClassBooking, { generateBookingNumber } from '../models/ClassBooking.js';
import { ApiError } from '../utils/ApiError.js';
import { ukLocalToUtc, upcomingUkDays } from '../utils/ukTime.js';
import { toPence } from './orderService.js';

export const HOLD_MINUTES = 35;
const GENERATE_EVERY_MS = 10 * 60 * 1000;
const RELEASE_EVERY_MS = 60 * 1000;

let lastGenerated = { at: 0, signature: '' };
let lastReleased = 0;

export function classPrice(classSettings) {
  const offer = Boolean(classSettings?.offerActive);
  return {
    unitPrice: offer ? classSettings.offerPrice : classSettings.regularPrice,
    regularPrice: classSettings.regularPrice,
    offerApplied: offer,
  };
}

/** UTC start times for the weekly timetable over the next `weeksAhead` weeks. */
export function scheduledStartTimes(classSettings, from = new Date()) {
  const slots = classSettings?.schedule || [];
  const days = upcomingUkDays((classSettings?.weeksAhead || 0) * 7, from);
  const starts = [];
  for (const day of days) {
    for (const slot of slots) {
      if (slot.weekday !== day.weekday) continue;
      const [hour, minute] = slot.time.split(':').map(Number);
      const startsAt = ukLocalToUtc(day.year, day.month, day.day, hour, minute);
      if (startsAt > from) starts.push(startsAt);
    }
  }
  return starts.sort((a, b) => a - b);
}

/**
 * Keeps the calendar rolling forward: creates sessions for the timetable, applies the
 * default capacity/duration to dates the owner hasn't customised, and removes unbooked
 * dates that no longer match the timetable.
 */
export async function ensureUpcomingSessions(classSettings, { force = false } = {}) {
  const signature = JSON.stringify({
    schedule: (classSettings.schedule || []).map(({ weekday, time }) => ({ weekday, time })),
    weeksAhead: classSettings.weeksAhead,
    capacity: classSettings.capacity,
    durationMinutes: classSettings.durationMinutes,
  });
  const now = new Date();
  if (!force && signature === lastGenerated.signature && now - lastGenerated.at < GENERATE_EVERY_MS) return;
  lastGenerated = { at: now.getTime(), signature };

  const starts = scheduledStartTimes(classSettings, now);
  if (starts.length) {
    await ClassSession.bulkWrite(
      starts.map((startsAt) => ({
        updateOne: {
          filter: { startsAt },
          update: {
            $setOnInsert: {
              startsAt,
              durationMinutes: classSettings.durationMinutes,
              capacity: classSettings.capacity,
              placesTaken: 0,
              status: 'scheduled',
              source: 'schedule',
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  await ClassSession.updateMany(
    {
      startsAt: { $gt: now },
      capacityLocked: false,
      capacity: { $ne: classSettings.capacity },
      placesTaken: { $lte: classSettings.capacity },
    },
    { $set: { capacity: classSettings.capacity } }
  );
  await ClassSession.updateMany(
    { startsAt: { $gt: now }, source: 'schedule', durationMinutes: { $ne: classSettings.durationMinutes } },
    { $set: { durationMinutes: classSettings.durationMinutes } }
  );

  const stale = await ClassSession.find(
    { startsAt: { $gt: now, $nin: starts }, source: 'schedule', placesTaken: 0 },
    '_id'
  ).lean();
  if (stale.length) {
    const booked = await ClassBooking.distinct('session', { session: { $in: stale.map((s) => s._id) } });
    const bookedIds = new Set(booked.map(String));
    const removable = stale.filter((s) => !bookedIds.has(String(s._id))).map((s) => s._id);
    if (removable.length) await ClassSession.deleteMany({ _id: { $in: removable }, placesTaken: 0 });
  }
}

export function resetGenerationCache() {
  lastGenerated = { at: 0, signature: '' };
}

/** Atomically takes places; returns null when the date is full, cancelled or in the past. */
export function reservePlaces(sessionId, places, { allowPast = false } = {}) {
  const filter = {
    _id: sessionId,
    status: 'scheduled',
    $expr: { $lte: [{ $add: ['$placesTaken', places] }, '$capacity'] },
  };
  if (!allowPast) filter.startsAt = { $gt: new Date() };
  return ClassSession.findOneAndUpdate(filter, { $inc: { placesTaken: places } }, { returnDocument: 'after' });
}

/** Gives a booking's places back to its date, at most once. */
export async function releaseBookingPlaces(bookingId) {
  const booking = await ClassBooking.findOneAndUpdate(
    { _id: bookingId, placesHeld: true },
    { $set: { placesHeld: false } },
    { returnDocument: 'after' }
  );
  if (!booking) return null;
  await ClassSession.updateOne(
    { _id: booking.session, placesTaken: { $gte: booking.places } },
    { $inc: { placesTaken: -booking.places } }
  );
  return booking;
}

/** Cancels unpaid bookings older than the hold window and frees their places. */
export async function releaseStaleHolds({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastReleased < RELEASE_EVERY_MS) return 0;
  lastReleased = now;

  const cutoff = new Date(now - HOLD_MINUTES * 60 * 1000);
  const stale = await ClassBooking.find(
    { status: 'pending_payment', placesHeld: true, createdAt: { $lt: cutoff } },
    '_id'
  ).lean();
  let released = 0;
  for (const { _id } of stale) {
    const cancelled = await ClassBooking.findOneAndUpdate(
      { _id, status: 'pending_payment' },
      { $set: { status: 'cancelled', cancelledAt: new Date() } }
    );
    if (cancelled && (await releaseBookingPlaces(_id))) released += 1;
  }
  return released;
}

export async function createPendingBooking({ sessionId, places, name, email, phone, classSettings }) {
  const session = await reservePlaces(sessionId, places);
  if (!session) {
    const existing = await ClassSession.findById(sessionId);
    if (!existing || existing.status !== 'scheduled' || existing.startsAt <= new Date()) {
      throw new ApiError(409, 'That date is no longer available. Please choose another date.', {
        sessionId: 'That date is no longer available.',
      });
    }
    const left = existing.placesLeft;
    throw new ApiError(
      409,
      left ? `Only ${left} ${left === 1 ? 'place is' : 'places are'} left on that date.` : 'That date is now fully booked.',
      { places: left ? `Only ${left} left.` : 'Fully booked.', placesLeft: String(left) }
    );
  }

  const { unitPrice, offerApplied } = classPrice(classSettings);
  const total = toPence(unitPrice) * places;
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await ClassBooking.create({
          bookingNumber: generateBookingNumber(),
          session: session._id,
          sessionStartsAt: session.startsAt,
          durationMinutes: session.durationMinutes,
          venue: classSettings.venue,
          name,
          email,
          phone,
          places,
          unitPrice,
          total: total / 100,
          offerApplied,
          placesHeld: true,
        });
      } catch (error) {
        if (error?.code !== 11000 || attempt === 2) throw error;
      }
    }
  } catch (error) {
    await ClassSession.updateOne({ _id: session._id, placesTaken: { $gte: places } }, { $inc: { placesTaken: -places } });
    throw error;
  }
  return null;
}

/** Marks a booking paid. Safe to call repeatedly from the webhook and the confirmation page. */
export async function finalizePaidBooking(stripeSession) {
  if (!stripeSession || stripeSession.payment_status !== 'paid') return null;
  const bookingId = stripeSession.metadata?.bookingId;
  if (!bookingId) return null;

  const booking = await ClassBooking.findOneAndUpdate(
    {
      _id: bookingId,
      stripeSessionId: stripeSession.id,
      paidAt: null,
      status: { $in: ['pending_payment', 'cancelled'] },
    },
    {
      $set: {
        status: 'paid',
        paidAt: new Date(),
        cancelledAt: null,
        stripePaymentIntentId:
          typeof stripeSession.payment_intent === 'string'
            ? stripeSession.payment_intent
            : stripeSession.payment_intent?.id || '',
      },
    },
    { returnDocument: 'after' }
  );
  if (!booking) return ClassBooking.findOne({ _id: bookingId, stripeSessionId: stripeSession.id });

  const notes = [];
  if (!booking.placesHeld) {
    // The hold lapsed before payment arrived; take the places again if they're still free.
    const session = await reservePlaces(booking.session, booking.places, { allowPast: true });
    const held = session
      ? await ClassBooking.updateOne({ _id: booking._id, placesHeld: false }, { $set: { placesHeld: true } })
      : null;
    if (!held?.modifiedCount) {
      if (session) {
        await ClassSession.updateOne({ _id: session._id }, { $inc: { placesTaken: -booking.places } });
      }
      booking.capacityIssue = true;
      notes.push('Payment arrived after the place hold expired and the date had no room left. Please contact the customer.');
    } else {
      booking.placesHeld = true;
    }
  }
  if (stripeSession.amount_total !== undefined && stripeSession.amount_total !== toPence(booking.total)) {
    notes.push(`Stripe charged ${stripeSession.amount_total / 100} but the booking total is ${booking.total}.`);
  }
  if (notes.length) {
    booking.adminNotes = [booking.adminNotes, ...notes].filter(Boolean).join('\n');
    await booking.save();
  }
  return booking;
}

export async function cancelPendingBooking(stripeSession) {
  const bookingId = stripeSession?.metadata?.bookingId;
  if (!bookingId) return null;
  const booking = await ClassBooking.findOneAndUpdate(
    { _id: bookingId, stripeSessionId: stripeSession.id, status: 'pending_payment' },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (booking) await releaseBookingPlaces(booking._id);
  return booking;
}
