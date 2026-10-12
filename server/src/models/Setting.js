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
};

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
