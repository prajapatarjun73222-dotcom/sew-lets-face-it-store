import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJSON, writeJSON } from '../utils/storage';
import { effectivePrice } from '../utils/format';

const CART_KEY = 'slfi_bag_v1';
const MAX_PER_LINE = 10;

const CartContext = createContext(null);

const lineKey = (productId, variant, personalisation) =>
  [productId, variant || '', (personalisation || '').trim().toLowerCase()].join('::');

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readJSON(CART_KEY, []));

  useEffect(() => writeJSON(CART_KEY, items), [items]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === CART_KEY) setItems(readJSON(CART_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const quantityForProduct = useCallback(
    (productId, excludeKey) =>
      items.filter((i) => i.productId === productId && i.key !== excludeKey).reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  /** Returns { ok, message } so callers can show feedback. */
  const addItem = useCallback(
    (product, { quantity = 1, variant = '', personalisation = '' } = {}) => {
      const qty = Number.parseInt(quantity, 10);
      if (!Number.isInteger(qty) || qty < 1) return { ok: false, message: 'Please choose a valid quantity.' };
      if (!product?.stock || product.stock < 1) return { ok: false, message: 'Sorry, this item is currently sold out.' };

      const key = lineKey(product._id, variant, personalisation);
      const alreadyInBag = quantityForProduct(product._id);
      if (alreadyInBag + qty > product.stock) {
        const remaining = Math.max(0, product.stock - alreadyInBag);
        return {
          ok: false,
          message: remaining
            ? `Only ${remaining} more available - you already have ${alreadyInBag} in your bag.`
            : `You already have all ${product.stock} available in your bag.`,
        };
      }

      setItems((current) => {
        const existing = current.find((i) => i.key === key);
        if (existing) {
          return current.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(i.quantity + qty, MAX_PER_LINE, product.stock) } : i
          );
        }
        return [
          ...current,
          {
            key,
            productId: product._id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] || '',
            price: effectivePrice(product),
            regularPrice: product.price,
            stock: product.stock,
            variant,
            personalisation: personalisation.trim(),
            quantity: Math.min(qty, MAX_PER_LINE),
          },
        ];
      });
      return { ok: true, message: `${product.name} added to your bag.` };
    },
    [quantityForProduct]
  );

  const updateQuantity = useCallback(
    (key, quantity) => {
      setItems((current) =>
        current.map((item) => {
          if (item.key !== key) return item;
          const otherLines = current
            .filter((i) => i.productId === item.productId && i.key !== key)
            .reduce((sum, i) => sum + i.quantity, 0);
          const max = Math.max(1, Math.min(MAX_PER_LINE, item.stock - otherLines));
          const next = Math.max(1, Math.min(Number.parseInt(quantity, 10) || 1, max));
          return { ...item, quantity: next };
        })
      );
    },
    []
  );

  const removeItem = useCallback((key) => setItems((current) => current.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Refresh price/stock from the latest product data returned by the API. */
  const syncProduct = useCallback((product) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === product._id
          ? {
              ...item,
              name: product.name,
              slug: product.slug,
              image: product.images?.[0] || item.image,
              price: effectivePrice(product),
              regularPrice: product.price,
              stock: product.stock,
              quantity: Math.max(1, Math.min(item.quantity, product.stock || 1)),
            }
          : item
      )
    );
  }, []);

  const markUnavailable = useCallback((productId) => {
    setItems((current) => current.map((i) => (i.productId === productId ? { ...i, stock: 0 } : i)));
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      syncProduct,
      markUnavailable,
      maxPerLine: MAX_PER_LINE,
    };
  }, [items, addItem, updateQuantity, removeItem, clear, syncProduct, markUnavailable]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
