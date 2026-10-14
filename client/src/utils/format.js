const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const formatPrice = (value) => gbp.format(Number(value) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const hasSale = (product) =>
  product?.salePrice !== null && product?.salePrice !== undefined && product.salePrice < product.price;

export const effectivePrice = (product) => (hasSale(product) ? product.salePrice : product?.price ?? 0);

export const LOW_STOCK = 3;

export function stockLabel(stock) {
  if (!stock || stock <= 0) return { text: 'Currently sold out', tone: 'out' };
  if (stock <= LOW_STOCK) return { text: `Only ${stock} left`, tone: 'low' };
  return { text: 'In stock', tone: 'in' };
}

/** Mirrors the server's shipping rule; the server total is always authoritative. */
export function shippingFor(subtotal, orders) {
  const freeOver = Number(orders?.freeShippingOver) || 0;
  if (freeOver > 0 && subtotal >= freeOver) return 0;
  return Number(orders?.shippingFlatRate) || 0;
}

/** Class times are always shown in UK time, whatever the visitor's device is set to. */
const UK = 'Europe/London';
const ukFormat = (options) => new Intl.DateTimeFormat('en-GB', { timeZone: UK, ...options });
const ukTime = ukFormat({ hour: 'numeric', minute: '2-digit', hour12: true });
const ukShortDate = ukFormat({ weekday: 'short', day: 'numeric', month: 'short' });
const ukLongDate = ukFormat({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const ukMonth = ukFormat({ month: 'long', year: 'numeric' });
const ukMonthKey = ukFormat({ year: 'numeric', month: '2-digit' });

export const formatClassTime = (value) => ukTime.format(new Date(value)).replace(/\s?([ap]m)$/i, ' $1').toLowerCase();
export const formatClassDay = (value) => ukShortDate.format(new Date(value));
export const formatClassLongDate = (value) => ukLongDate.format(new Date(value));
export const formatClassMonth = (value) => ukMonth.format(new Date(value));
export const classMonthKey = (value) => ukMonthKey.format(new Date(value));

export function formatClassTimeRange(startsAt, durationMinutes) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return `${formatClassTime(start)} - ${formatClassTime(end)}`;
}

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "18:00" + 120 minutes -> "6:00 - 8:00 pm" style labels for the weekly timetable. */
export function formatSlotRange(time, durationMinutes) {
  const [h, m] = time.split(':').map(Number);
  const toLabel = (total) => {
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    const suffix = hour < 12 ? 'am' : 'pm';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  };
  return `${toLabel(h * 60 + m)} - ${toLabel(h * 60 + m + durationMinutes)}`;
}

export const isEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value).trim());

/** Resize Unsplash URLs for thumbnails; other URLs are returned unchanged. */
export function sizedImage(url, width) {
  if (!url) return '';
  if (!url.includes('images.unsplash.com')) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', '80');
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    return parsed.toString();
  } catch {
    return url;
  }
}
