import mongoose from 'mongoose';

export const ENQUIRY_TYPES = ['General enquiry', 'Product enquiry', 'Custom creation', 'Personalised gift', 'Other'];
export const ENQUIRY_STATUSES = ['new', 'in-progress', 'resolved'];

const contactEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    enquiryType: { type: String, enum: ENQUIRY_TYPES, default: 'General enquiry' },
    interest: { type: String, trim: true, maxlength: 120, default: '' },
    productReference: { type: String, trim: true, maxlength: 160, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new', index: true },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactEnquiry', contactEnquirySchema);
