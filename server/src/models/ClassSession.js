import mongoose from 'mongoose';

export const SESSION_STATUSES = ['scheduled', 'cancelled'];

const classSessionSchema = new mongoose.Schema(
  {
    startsAt: { type: Date, required: true, unique: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 600 },
    capacity: { type: Number, required: true, min: 0, max: 50 },
    placesTaken: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: SESSION_STATUSES, default: 'scheduled', index: true },
    // 'schedule' sessions are generated from the weekly timetable, 'extra' ones are added by hand
    source: { type: String, enum: ['schedule', 'extra'], default: 'schedule' },
    // true once the owner sets this date's capacity by hand, so the default no longer overrides it
    capacityLocked: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

classSessionSchema.virtual('placesLeft').get(function placesLeft() {
  return Math.max(0, this.capacity - this.placesTaken);
});

classSessionSchema.methods.toPublicJSON = function toPublicJSON() {
  const bookable = this.status === 'scheduled' && this.startsAt > new Date();
  return {
    _id: this._id,
    startsAt: this.startsAt,
    durationMinutes: this.durationMinutes,
    capacity: this.capacity,
    placesLeft: bookable ? this.placesLeft : 0,
    status: this.status,
    note: this.note,
  };
};

export default mongoose.model('ClassSession', classSessionSchema);
