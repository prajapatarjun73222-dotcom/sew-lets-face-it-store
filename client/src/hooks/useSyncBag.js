import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useCart } from '../context/CartContext';

/** Re-checks price and stock for every product in the bag against the API. */
export default function useSyncBag() {
  const { items, syncProduct, markUnavailable } = useCart();
  const slugs = useMemo(() => [...new Set(items.map((i) => i.slug))].sort().join('|'), [items]);
  const [checking, setChecking] = useState(false);
  const [version, setVersion] = useState(0);

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
    // Only re-check when the set of products changes (or on demand), not on quantity edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs, version, syncProduct, markUnavailable]);

  const recheck = useCallback(() => setVersion((v) => v + 1), []);
  return { checking, recheck };
}
