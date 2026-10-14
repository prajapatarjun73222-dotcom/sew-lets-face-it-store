import mongoose from 'mongoose';

export const DEFAULT_SETTINGS = {
  brandName: 'Sew Lets Face It',
  brandDescription:
    'Handmade bags and accessories with personality, creativity and care, designed and stitched by Jackie Samuels in the UK.',
  contactEmail: '',
  announcement: 'Handmade with care in the UK · Discover something uniquely yours',
  social: {
    instagram: 'https://www.instagram.com/sew_lets_face_it/',
    facebook: 'https://www.facebook.com/sewletsfaceit/',
    etsy: 'https://sewletsfaceitbyjax.etsy.com',
    website: 'https://www.sewletsfaceit.co.uk',
  },
  images: {
    hero: [
      'https://images.unsplash.com/photo-1771585655058-1772ec95b84b?w=1800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=1800&q=80&auto=format&fit=crop',
    ],
    story: 'https://images.unsplash.com/photo-1753162659771-d5b192b52678?w=1400&q=80&auto=format&fit=crop',
    custom: 'https://images.unsplash.com/photo-1767839507898-9a8624bdd8b0?w=1400&q=80&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=1800&q=80&auto=format&fit=crop',
    instagram: [
      'https://images.unsplash.com/photo-1527385352018-3c26dd6c3916?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603290939650-b553549a5739?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1777148783728-510bbeeba075?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1758398332771-0a79c5df74a3?w=600&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1753162659771-d5b192b52678?w=600&q=80&auto=format&fit=crop',
    ],
  },
  orders: {
    enabled: true,
    shippingFlatRate: 3.95,
    freeShippingOver: 50,
  },
  contactPhone: '',
  classes: {
    enabled: true,
    regularPrice: 35,
    offerPrice: 25,
    offerActive: false,
    capacity: 4,
    weeksAhead: 8,
    durationMinutes: 120,
    schedule: [
      { weekday: 1, time: '18:00' },
      { weekday: 3, time: '15:30' },
    ],
    venue: 'LOTT Bazaar, 29 Clemens Street, Leamington Spa',
    image:
      'https://images.unsplash.com/photo-1742674537189-415cfb85ce05?w=1200&q=80&auto=format&fit=crop',
  },
};

const scheduleSlotSchema = new mongoose.Schema(
  {
    // 0 = Sunday ... 6 = Saturday, matching Date#getDay
    weekday: { type: Number, required: true, min: 0, max: 6 },
    time: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24 hour)'] },
  },
  { _id: false }
);

const optionalUrl = {
  type: String,
  trim: true,
  default: '',
  match: [/^(https?:\/\/\S+)?$/i, 'Must be a valid http(s) URL'],
};

const urlItem = { type: String, trim: true, match: [/^https?:\/\/\S+$/i, 'Must be a valid http(s) URL'] };

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    brandName: { type: String, trim: true, maxlength: 80, default: DEFAULT_SETTINGS.brandName },
    brandDescription: { type: String, trim: true, maxlength: 600, default: DEFAULT_SETTINGS.brandDescription },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: DEFAULT_SETTINGS.contactEmail },
    announcement: { type: String, trim: true, maxlength: 160, default: DEFAULT_SETTINGS.announcement },
    social: {
      instagram: { ...optionalUrl, default: DEFAULT_SETTINGS.social.instagram },
      facebook: { ...optionalUrl, default: DEFAULT_SETTINGS.social.facebook },
      etsy: { ...optionalUrl, default: DEFAULT_SETTINGS.social.etsy },
      website: { ...optionalUrl, default: DEFAULT_SETTINGS.social.website },
    },
    images: {
      hero: { type: [urlItem], default: () => [...DEFAULT_SETTINGS.images.hero] },
      story: { ...optionalUrl, default: DEFAULT_SETTINGS.images.story },
      custom: { ...optionalUrl, default: DEFAULT_SETTINGS.images.custom },
      banner: { ...optionalUrl, default: DEFAULT_SETTINGS.images.banner },
      instagram: { type: [urlItem], default: () => [...DEFAULT_SETTINGS.images.instagram] },
    },
    orders: {
      enabled: { type: Boolean, default: DEFAULT_SETTINGS.orders.enabled },
      shippingFlatRate: { type: Number, min: 0, max: 100, default: DEFAULT_SETTINGS.orders.shippingFlatRate },
      // 0 means free shipping is never applied automatically
      freeShippingOver: { type: Number, min: 0, max: 10000, default: DEFAULT_SETTINGS.orders.freeShippingOver },
    },
    contactPhone: { type: String, trim: true, maxlength: 30, default: DEFAULT_SETTINGS.contactPhone },
    classes: {
      enabled: { type: Boolean, default: DEFAULT_SETTINGS.classes.enabled },
      regularPrice: { type: Number, min: 0, max: 1000, default: DEFAULT_SETTINGS.classes.regularPrice },
      offerPrice: { type: Number, min: 0, max: 1000, default: DEFAULT_SETTINGS.classes.offerPrice },
      offerActive: { type: Boolean, default: DEFAULT_SETTINGS.classes.offerActive },
      capacity: { type: Number, min: 1, max: 50, default: DEFAULT_SETTINGS.classes.capacity },
      weeksAhead: { type: Number, min: 1, max: 26, default: DEFAULT_SETTINGS.classes.weeksAhead },
      durationMinutes: { type: Number, min: 15, max: 600, default: DEFAULT_SETTINGS.classes.durationMinutes },
      schedule: {
        type: [scheduleSlotSchema],
        default: () => DEFAULT_SETTINGS.classes.schedule.map((slot) => ({ ...slot })),
      },
      venue: { type: String, trim: true, maxlength: 200, default: DEFAULT_SETTINGS.classes.venue },
      image: { ...optionalUrl, default: DEFAULT_SETTINGS.classes.image },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getSingleton = async function getSingleton() {
  return this.findOneAndUpdate(
    { key: 'site' },
    { $setOnInsert: { key: 'site' } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

export default mongoose.model('Setting', settingSchema);
