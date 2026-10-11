import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

const WISHLIST_KEY = 'slfi_wishlist_v1';
const WishlistContext = createContext(null);

const snapshot = (product) => ({
  _id: product._id,
  slug: product.slug,
  name: product.name,
  images: product.images?.slice(0, 1) || [],
  price: product.price,
  salePrice: product.salePrice ?? null,
  stock: product.stock,
  category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
});

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => readJSON(WISHLIST_KEY, []));

  useEffect(() => writeJSON(WISHLIST_KEY, items), [items]);

  const has = useCallback((id) => items.some((p) => p._id === id), [items]);

  const toggle = useCallback(
    (product) => {
      const exists = items.some((p) => p._id === product._id);
      setItems((current) =>
        current.some((p) => p._id === product._id)
          ? current.filter((p) => p._id !== product._id)
          : [snapshot(product), ...current]
      );
      return !exists;
    },
    [items]
  );

  const remove = useCallback((id) => setItems((current) => current.filter((p) => p._id !== id)), []);

  const value = useMemo(() => ({ items, count: items.length, has, toggle, remove }), [items, has, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
