import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, Info, Mail, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { formatPrice, sizedImage } from '../utils/format';

function useSyncBag() {
  const { items, syncProduct, markUnavailable } = useCart();
  const slugs = useMemo(() => [...new Set(items.map((i) => i.slug))].sort().join('|'), [items]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!slugs) return undefined;
    let active = true;
    setChecking(true);
    const pairs = slugs.split('|').map((slug) => ({ slug, productId: items.find((i) => i.slug === slug)?.productId }));
    Promise.allSettled(pairs.map(({ slug }) => api.get(`/products/${slug}`))).then((results) => {
      if (!active) return;
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') syncProduct(result.value.data.product);
        else if (result.reason?.response?.status === 404) markUnavailable(pairs[idx].productId);
      });
      setChecking(false);
    });
    return () => {
      active = false;
    };
    // Only re-check when the set of products changes, not on quantity edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs, syncProduct, markUnavailable]);

  return checking;
}

export default function Bag() {
  useDocumentTitle('Your Bag');
  const { items, count, subtotal, updateQuantity, removeItem, maxPerLine } = useCart();
  const checking = useSyncBag();

  if (!items.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          action={<Button to="/shop">Continue Shopping</Button>}
        >
          Browse the collection and add your favourite handmade pieces - they'll be saved here, even if you refresh the page.
        </EmptyState>
      </div>
    );
  }

  const hasUnavailable = items.some((i) => i.stock <= 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl text-charcoal sm:text-5xl">Your Bag</h1>
          <p className="mt-2 text-sm text-muted">
            {count} {count === 1 ? 'item' : 'items'}
            {checking && ' · checking latest availability…'}
          </p>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Continue Shopping
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-beige border-y border-beige">
          {items.map((item) => {
            const unavailable = item.stock <= 0;
            const max = Math.min(maxPerLine, item.stock);
            return (
              <li key={item.key} className="flex gap-4 py-6 sm:gap-6">
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  {item.image ? (
                    <img
                      src={sizedImage(item.image, 240)}
                      alt={item.name}
                      className="h-32 w-24 rounded-sm object-cover sm:h-36 sm:w-28"
                    />
                  ) : (
                    <div className="h-32 w-24 rounded-sm bg-beige/60 sm:h-36 sm:w-28" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-medium text-charcoal hover:text-terracotta">
                        {item.name}
                      </Link>
                      {item.variant && <p className="mt-1 text-xs text-muted">Option: {item.variant}</p>}
                      {item.personalisation && (
                        <p className="mt-1 text-xs text-muted">Personalisation: “{item.personalisation}”</p>
                      )}
                      {unavailable && <p className="mt-1 text-xs font-medium text-red-700">No longer available</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      {item.quantity > 1 && <p className="text-xs text-muted">{formatPrice(item.price)} each</p>}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="inline-flex items-center rounded-sm border border-beige-dark bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1 || unavailable}
                        className="flex size-9 items-center justify-center disabled:opacity-40"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm" aria-live="polite" aria-label={`Quantity ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= max || unavailable}
                        className="flex size-9 items-center justify-center disabled:opacity-40"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-sm border border-beige bg-white p-6 lg:sticky lg:top-28" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-2xl text-charcoal">
            Bag Summary
          </h2>
          <dl className="mt-5 space-y-3 border-b border-beige pb-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items</dt>
              <dd>{count}</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-sm bg-beige/50 p-4 text-sm leading-relaxed text-charcoal">
            <p className="flex gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden />
              <span>
                Online ordering is coming soon. Contact us to enquire about purchasing a product or requesting a custom
                creation.
              </span>
            </p>
          </div>

          {hasUnavailable && (
            <p className="mt-3 text-xs text-red-700">Some items are no longer available - please remove them.</p>
          )}

          <div className="mt-5 space-y-3">
            <Button
              to={`/contact?product=${encodeURIComponent(items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity}`).join(', ').slice(0, 160))}`}
              className="w-full"
            >
              <Mail className="size-4" aria-hidden /> Contact Us
            </Button>
            <Button to="/shop" variant="light" className="w-full">
              Continue Shopping
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted">No payment is taken on this website.</p>
        </aside>
      </div>
    </div>
  );
}
