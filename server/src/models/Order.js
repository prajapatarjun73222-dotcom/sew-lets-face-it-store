import mongoose from 'mongoose';
import { generateReference } from '../utils/reference.js';

export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const ADMIN_SETTABLE_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const RESTOCK_STATUSES = ['cancelled', 'refunded'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    variant: { type: String, trim: true, default: '' },
    personalisation: { type: String, trim: true, maxlength: 300, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    stockDeducted: { type: Boolean, default: false },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const generateOrderNumber = (date = new Date()) => generateReference('SLF', date);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, trim: true, maxlength: 30, default: '' },
    },
    shippingAddress: {
      line1: { type: String, required: true, trim: true, maxlength: 120 },
      line2: { type: String, trim: true, maxlength: 120, default: '' },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      county: { type: String, trim: true, maxlength: 80, default: '' },
      postcode: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
      country: { type: String, default: 'GB' },
    },
    items: {
      type: [itemSchema],
      validate: [(items) => items.length > 0, 'An order needs at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'gbp' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment', index: true },
    statusHistory: { type: [historySchema], default: [] },
    stripeSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    stockAdjusted: { type: Boolean, default: false },
    stockIssue: { type: Boolean, default: false },
    trackingNumber: { type: String, trim: true, maxlength: 80, default: '' },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ email: 1, orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.methods.setStatus = function setStatus(status, note = '') {
  this.status = status;
  this.statusHistory.push({ status, note, at: new Date() });
};

orderSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    email: this.email,
    customer: { name: this.customer.name },
    shippingAddress: this.shippingAddress,
    items: this.items.map(({ name, slug, image, variant, personalisation, unitPrice, quantity, lineTotal }) => ({
      name,
      slug,
      image,
      variant,
      personalisation,
      unitPrice,
      quantity,
      lineTotal,
    })),
    subtotal: this.subtotal,
    shippingCost: this.shippingCost,
    total: this.total,
    currency: this.currency,
    trackingNumber: this.trackingNumber,
    paidAt: this.paidAt,
    createdAt: this.createdAt,
    statusHistory: this.statusHistory.map(({ status, at }) => ({ status, at })),
  };
};

export default mongoose.model('Order', orderSchema);
