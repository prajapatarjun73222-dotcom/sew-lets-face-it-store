import mongoose from 'mongoose';
import { generateReference } from '../utils/reference.js';

export const BOOKING_STATUSES = ['pending_payment', 'paid', 'cancelled', 'refunded'];

export const generateBookingNumber = (date = new Date()) => generateReference('SLC', date);

const classBookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true, index: true },
    sessionStartsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    venue: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    places: { type: Number, required: true, min: 1, max: 50 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'gbp' },
    offerApplied: { type: Boolean, default: false },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending_payment', index: true },
    // true while this booking's places are counted in the session's placesTaken
    placesHeld: { type: Boolean, default: false },
    // set when a payment arrives after its hold was released and the class had filled up
    capacityIssue: { type: Boolean, default: false },
    stripeSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

classBookingSchema.index({ status: 1, placesHeld: 1, createdAt: 1 });

classBookingSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    bookingNumber: this.bookingNumber,
    status: this.status,
    name: this.name,
    email: this.email,
    sessionStartsAt: this.sessionStartsAt,
    durationMinutes: this.durationMinutes,
    venue: this.venue,
    places: this.places,
    unitPrice: this.unitPrice,
    total: this.total,
    currency: this.currency,
    paidAt: this.paidAt,
  };
};

export default mongoose.model('ClassBooking', classBookingSchema);
