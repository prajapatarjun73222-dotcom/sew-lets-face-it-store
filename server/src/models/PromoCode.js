import mongoose from 'mongoose';

const CODE_PATTERN = /^[A-Z0-9]{3,20}$/;

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      validate: {
        validator: (value) => CODE_PATTERN.test(value),
        message: 'Code must be 3-20 letters or numbers',
      },
    },
    type: {
      type: String,
      enum: ['percentage'],
      default: 'percentage',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [1, 'Percentage must be at least 1'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promoCodeSchema.methods.isCurrentlyValid = function isCurrentlyValid(now = new Date()) {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt.getTime() <= now.getTime()) return false;
  return true;
};

promoCodeSchema.statics.normalizeCode = function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase();
};

export default mongoose.model('PromoCode', promoCodeSchema);
