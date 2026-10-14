import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

export const FALLBACK_SETTINGS = {
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
    hero: ['https://images.unsplash.com/photo-1771585655058-1772ec95b84b?w=1800&q=80&auto=format&fit=crop'],
    story: 'https://images.unsplash.com/photo-1753162659771-d5b192b52678?w=1400&q=80&auto=format&fit=crop',
    custom: 'https://images.unsplash.com/photo-1767839507898-9a8624bdd8b0?w=1400&q=80&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=1800&q=80&auto=format&fit=crop',
    instagram: [],
  },
  orders: { enabled: false, shippingFlatRate: 0, freeShippingOver: 0 },
  checkoutAvailable: false,
  contactPhone: '',
  classes: {
    enabled: false,
    regularPrice: 35,
    offerPrice: 25,
    offerActive: false,
    capacity: 4,
    weeksAhead: 8,
    durationMinutes: 120,
    schedule: [],
    venue: '',
    image: '',
  },
  classBookingAvailable: false,
};

const SettingsContext = createContext({ settings: FALLBACK_SETTINGS, loading: false, refresh: () => {} });

function merge(data) {
  return {
    ...FALLBACK_SETTINGS,
    ...data,
    social: { ...FALLBACK_SETTINGS.social, ...(data?.social || {}) },
    images: { ...FALLBACK_SETTINGS.images, ...(data?.images || {}) },
    orders: { ...FALLBACK_SETTINGS.orders, ...(data?.orders || {}) },
    classes: { ...FALLBACK_SETTINGS.classes, ...(data?.classes || {}) },
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(merge(data.settings));
    } catch {
      // Fall back to built-in defaults if the API is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, loading, refresh, setSettings: (s) => setSettings(merge(s)) }), [settings, loading, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
