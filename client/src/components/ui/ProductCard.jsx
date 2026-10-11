import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, hasSale, sizedImage, stockLabel } from '../../utils/format';

const toneClass = { in: 'text-forest', low: 'text-terracotta', out: 'text-muted' };

export function WishlistButton({ product, className = '' }) {
  const wishlist = useWishlist();
  const { notify } = useToast();
  const active = wishlist.has(product._id);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        const added = wishlist.toggle(product);
        notify(added ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`flex size-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:scale-105 hover:text-terracotta ${className}`}
    >
      <Heart className={`size-[18px] ${active ? 'fill-terracotta text-terracotta' : ''}`} strokeWidth={1.6} />
    </button>
  );
}

export function Price({ product, className = '' }) {
  if (hasSale(product)) {
    return (
      <p className={`flex items-baseline gap-2 ${className}`}>
        <span className="font-medium text-terracotta">{formatPrice(product.salePrice)}</span>
        <span className="text-xs text-muted line-through">{formatPrice(product.price)}</span>
        <span className="sr-only">Sale price</span>
      </p>
    );
  }
  return <p className={`font-medium ${className}`}>{formatPrice(product.price)}</p>;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const stock = stockLabel(product.stock);
  const soldOut = product.stock <= 0;
  const href = `/product/${product.slug}`;

  const handleAdd = () => {
    const result = addItem(product, { quantity: 1, variant: product.variants?.[0]?.name || '' });
    notify(result.message, result.ok ? 'success' : 'error');
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-beige/80 bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_-12px_rgba(41,40,36,0.18)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige/40">
        <Link to={href} aria-label={`View ${product.name}`}>
          {product.images?.[0] ? (
            <img
              src={sizedImage(product.images[0], 600)}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-serif text-muted">No image yet</div>
          )}
        </Link>
        <WishlistButton product={product} className="absolute top-3 right-3" />
        {hasSale(product) && (
          <span className="absolute top-3 left-3 rounded-sm bg-terracotta px-2 py-1 text-[10px] font-medium tracking-wider text-white uppercase">
            Sale
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-3 left-3 rounded-sm bg-charcoal/80 px-2 py-1 text-[10px] font-medium tracking-wider text-cream uppercase">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && <p className="mb-1 text-[11px] tracking-wider text-muted uppercase">{product.category.name}</p>}
        <h3 className="font-sans text-sm leading-snug font-medium tracking-normal text-charcoal">
          <Link to={href} className="hover:text-terracotta">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <Price product={product} />
          <span className={`text-xs ${toneClass[stock.tone]}`}>{stock.text}</span>
        </div>
        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="rounded-sm bg-terracotta px-3 py-2.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:bg-beige-dark disabled:text-charcoal/60"
          >
            {soldOut ? 'Sold out' : 'Add to Bag'}
          </button>
          <Link
            to={href}
            className="flex items-center rounded-sm border border-beige-dark px-3 text-xs font-medium text-charcoal transition-colors hover:border-terracotta hover:text-terracotta"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-sm border border-beige/80 bg-white">
      <div className="aspect-[4/5] bg-beige/50" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/3 rounded bg-beige/70" />
        <div className="h-3 w-1/3 rounded bg-beige/70" />
        <div className="h-9 rounded bg-beige/50" />
      </div>
    </div>
  );
}
