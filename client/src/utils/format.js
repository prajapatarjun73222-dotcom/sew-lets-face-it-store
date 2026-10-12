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
