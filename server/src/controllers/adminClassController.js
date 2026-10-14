import ClassSession from '../models/ClassSession.js';
import ClassBooking from '../models/ClassBooking.js';
import Setting from '../models/Setting.js';
import { getStripe } from '../config/stripe.js';
import { ApiError } from '../utils/ApiError.js';
import { ukLocalToUtc } from '../utils/ukTime.js';
import {
  ensureUpcomingSessions,
  releaseStaleHolds,
  releaseBookingPlaces,
  finalizePaidBooking,
} from '../services/classService.js';

// Abandoned checkouts (never paid, then cancelled) are noise for the owner.
const VISIBLE_BOOKINGS = { $or: [{ status: { $ne: 'cancelled' } }, { paidAt: { $ne: null } }] };

async function bookingCounts(sessionIds) {
  const rows = await ClassBooking.aggregate([
    { $match: { session: { $in: sessionIds }, status: { $in: ['paid', 'pending_payment'] } } },
    { $group: { _id: { session: '$session', status: '$status' }, places: { $sum: '$places' }, count: { $sum: 1 } } },
  ]);
  const map = new Map();
  for (const row of rows) {
    const key = String(row._id.session);
    const entry = map.get(key) || { paidPlaces: 0, paidBookings: 0, pendingPlaces: 0 };
    if (row._id.status === 'paid') {
      entry.paidPlaces = row.places;
      entry.paidBookings = row.count;
    } else {
      entry.pendingPlaces = row.places;
    }
    map.set(key, entry);
  }
  return map;
}

export async function listSessions(req, res) {
  const settings = await Setting.getSingleton();
  await releaseStaleHolds();
  if (settings.classes.enabled) await ensureUpcomingSessions(settings.classes);

  const now = new Date();
  const past = req.query.range === 'past';
  const sessions = await ClassSession.find(past ? { startsAt: { $lte: now } } : { startsAt: { $gt: now } })
    .sort({ startsAt: past ? -1 : 1 })
    .limit(past ? 60 : 200);
  const counts = await bookingCounts(sessions.map((s) => s._id));
  res.json({
    sessions: sessions.map((s) => ({
      ...s.toObject(),
      placesLeft: s.placesLeft,
      ...(counts.get(String(s._id)) || { paidPlaces: 0, paidBookings: 0, pendingPlaces: 0 }),
    })),
  });
}

export async function updateSession(req, res) {
  const session = await ClassSession.findById(req.params.id);
  if (!session) throw ApiError.notFound('Class date not found');
  const { capacity, status, note } = req.body;

  if (capacity !== undefined && capacity !== session.capacity) {
    const updated = await ClassSession.findOneAndUpdate(
      { _id: session._id, placesTaken: { $lte: capacity } },
      { $set: { capacity, capacityLocked: true } },
      { returnDocument: 'after' }
    );
    if (!updated) {
      throw ApiError.badRequest(`${session.placesTaken} places are already booked or being paid for on this date.`, {
        capacity: `Must be at least ${session.placesTaken}`,
      });
    }
    session.capacity = updated.capacity;
    session.capacityLocked = true;
  }
  if (status && status !== session.status) {
    if (status === 'scheduled' && session.startsAt <= new Date()) {
      throw ApiError.badRequest('This date has already passed, so it cannot be reopened.');
    }
    session.status = status;
  }
  if (note !== undefined) session.note = note;
  await session.save();
  res.json({ session: { ...session.toObject(), placesLeft: session.placesLeft } });
}

export async function createSession(req, res) {
  const settings = await Setting.getSingleton();
  const [year, month, day] = req.body.date.split('-').map(Number);
  const [hour, minute] = req.body.time.split(':').map(Number);
  const startsAt = ukLocalToUtc(year, month, day, hour, minute);
  if (startsAt <= new Date()) throw ApiError.badRequest('Please choose a date and time in the future.', { date: 'Must be in the future' });

  try {
    const session = await ClassSession.create({
      startsAt,
      durationMinutes: req.body.durationMinutes || settings.classes.durationMinutes,
      capacity: req.body.capacity || settings.classes.capacity,
      capacityLocked: Boolean(req.body.capacity),
      note: req.body.note || '',
      source: 'extra',
    });
    res.status(201).json({ session: { ...session.toObject(), placesLeft: session.placesLeft } });
  } catch (error) {
    if (error?.code === 11000) throw ApiError.conflict('There is already a class at that date and time.');
    throw error;
  }
}

export async function listSessionBookings(req, res) {
  const session = await ClassSession.findById(req.params.id);
  if (!session) throw ApiError.notFound('Class date not found');
  const filter = { session: session._id, ...(req.query.status ? { status: req.query.status } : VISIBLE_BOOKINGS) };
  const bookings = await ClassBooking.find(filter).sort({ createdAt: 1 });
  res.json({ session: { ...session.toObject(), placesLeft: session.placesLeft }, bookings });
}

export async function updateBooking(req, res) {
  const booking = await ClassBooking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  const { status, adminNotes } = req.body;

  if (status && status !== booking.status) {
    if (booking.status === 'refunded') throw ApiError.badRequest('Refunded bookings cannot be changed.');
    if (booking.status === 'pending_payment' && status !== 'cancelled') {
      throw ApiError.badRequest('This booking has not been paid yet. It can only be cancelled.');
    }
    if (booking.status === 'cancelled' && !booking.paidAt) {
      throw ApiError.badRequest('This booking was never paid, so there is nothing to refund.');
    }

    if (booking.status === 'pending_payment' && booking.stripeSessionId) {
      // Stop the customer finishing a payment for places that are being released.
      const stripe = getStripe();
      try {
        const checkout = stripe && (await stripe.checkout.sessions.retrieve(booking.stripeSessionId));
        if (checkout?.status === 'open') await stripe.checkout.sessions.expire(booking.stripeSessionId);
        if (checkout?.status === 'complete') {
          await finalizePaidBooking(checkout);
          throw ApiError.conflict('This booking has just been paid. Refresh the list and try again.');
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Could not expire class checkout session:', error.message);
      }
    }

    booking.status = status;
    if (!booking.cancelledAt) booking.cancelledAt = new Date();
    await booking.save();
    await releaseBookingPlaces(booking._id);
    booking.placesHeld = false;
  }
  if (adminNotes !== undefined) booking.adminNotes = adminNotes;
  await booking.save();
  res.json({ booking });
}

export async function classStats() {
  const now = new Date();
  const upcoming = await ClassSession.find({ startsAt: { $gt: now }, status: 'scheduled' }, '_id startsAt').sort({ startsAt: 1 });
  const ids = upcoming.map((s) => s._id);
  const [booked] = await ClassBooking.aggregate([
    { $match: { session: { $in: ids }, status: 'paid' } },
    { $group: { _id: null, places: { $sum: '$places' }, bookings: { $sum: 1 } } },
  ]);
  return {
    upcomingClassPlaces: booked?.places || 0,
    upcomingClassBookings: booked?.bookings || 0,
    nextClassAt: upcoming[0]?.startsAt || null,
  };
}
