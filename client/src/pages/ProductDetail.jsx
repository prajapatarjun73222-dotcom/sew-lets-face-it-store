import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, MessageSquare, Scissors, HandHeart, PackageX } from 'lucide-react';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ProductCard, { Price, WishlistButton } from '../components/ui/ProductCard';
import { sizedImage, stockLabel } from '../utils/format';

const MAX_PERSONALISATION = 60;

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [images]);

  if (!images.length) {
    return <div className="flex aspect-[4/5] items-center justify-center rounded-sm bg-beige/50 font-serif text-muted">No image yet</div>;
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-3 sm:flex-col" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`block size-16 overflow-hidden rounded-sm border-2 transition sm:size-20 ${
                  i === active ? 'border-terracotta' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={sizedImage(src, 200)} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative flex-1 overflow-hidden rounded-sm bg-beige/40">
        <img
          key={images[active]}
          src={sizedImage(images[active], 1200)}
          alt={`${name} - image ${active + 1}`}
          className="aspect-[4/5] w-full animate-fade-in object-cover"
        />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi(`/products/${slug}`);
  const product = data?.product;
  const related = data?.related || [];
  const { addItem, items } = useCart();
  const { notify } = useToast();

  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [personalisation, setPersonalisation] = useState('');
  const [formError, setFormError] = useState('');

  useDocumentTitle(product?.name || 'Product', product?.description?.slice(0, 155));

  useEffect(() => {
    setVariant(product?.variants?.[0]?.name || '');
    setQuantity(1);
    setPersonalisation('');
    setFormError('');
  }, [product]);

  if (loading) return <PageLoader label="Loading product…" />;
  if (error) {
    const notFound = /not found/i.test(error);
    return (
      <div className="container-page py-16">
        {notFound ? (
          <EmptyState icon={PackageX} title="We couldn't find that piece" action={<Button to="/shop">Browse the collection</Button>}>
            It may have sold out or been removed from the shop.
          </EmptyState>
        ) : (
          <Alert type="error" title="Something went wrong" action={<button onClick={reload} className="text-sm underline">Retry</button>}>
            {error}
          </Alert>
        )}
      </div>
    );
  }
  if (!product) return null;

  const inBag = items.filter((i) => i.productId === product._id).reduce((sum, i) => sum + i.quantity, 0);
  const available = Math.max(0, product.stock - inBag);
  const maxQty = Math.min(10, available);
  const stock = stockLabel(product.stock);
  const soldOut = product.stock <= 0;
  const fabricVariants = product.variants?.filter((v) => v.type === 'fabric') || [];
  const variantLabel = fabricVariants.length === product.variants?.length ? 'Fabric' : 'Colour';

  const changeQty = (next) => {
    setFormError('');
    setQuantity(Math.max(1, Math.min(maxQty || 1, next)));
  };

  const handleAdd = (event) => {
    event.preventDefault();
    setFormError('');
    if (product.variants?.length && !variant) return setFormError(`Please choose a ${variantLabel.toLowerCase()}.`);
    if (!Number.isInteger(quantity) || quantity < 1) return setFormError('Please choose a valid quantity.');
    if (quantity > available) {
      return setFormError(
        available > 0 ? `Only ${available} more available.` : 'You already have all available stock in your bag.'
      );
    }
    if (personalisation.length > MAX_PERSONALISATION) {
      return setFormError(`Personalisation must be ${MAX_PERSONALISATION} characters or fewer.`);
    }
    const result = addItem(product, { quantity, variant, personalisation });
    if (!result.ok) return setFormError(result.message);
    notify(result.message);
    setQuantity(1);
    return undefined;
  };

  return (
    <div className="pb-20">
      <nav aria-label="Breadcrumb" className="container-page py-5 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-terracotta">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3" aria-hidden />
          <li>
            <Link to="/shop" className="hover:text-terracotta">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <ChevronRight className="size-3" aria-hidden />
              <li>
                <Link to={`/shop?category=${product.category.slug}`} className="hover:text-terracotta">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <ChevronRight className="size-3" aria-hidden />
          <li aria-current="page" className="text-charcoal">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-page grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Gallery images={product.images || []} name={product.name} />

        <div className="lg:pt-4">
          {product.category && <p className="eyebrow mb-3">{product.category.name}</p>}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl leading-tight text-charcoal sm:text-5xl">{product.name}</h1>
            <WishlistButton product={product} className="mt-2 shrink-0 border border-beige" />
          </div>
          <Price product={product} className="mt-4 text-xl" />
          <p
            className={`mt-2 text-sm ${stock.tone === 'in' ? 'text-forest' : stock.tone === 'low' ? 'text-terracotta' : 'text-muted'}`}
          >
            {stock.text}
          </p>

          <p className="mt-6 text-[15px] leading-relaxed whitespace-pre-line text-charcoal/80">{product.description}</p>

          <form onSubmit={handleAdd} className="mt-8 space-y-6" noValidate>
            {product.variants?.length > 0 && (
              <fieldset>
                <legend className="label">
                  {variantLabel}: <span className="font-normal text-muted">{variant}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setVariant(v.name)}
                      aria-pressed={variant === v.name}
                      className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
                        variant === v.name
                          ? 'border-charcoal bg-charcoal text-cream'
                          : 'border-beige-dark bg-white text-charcoal hover:border-charcoal'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {product.isCustomisable && (
              <div>
                <label htmlFor="personalisation" className="label">
                  Personalisation <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="personalisation"
                  value={personalisation}
                  onChange={(e) => setPersonalisation(e.target.value.slice(0, MAX_PERSONALISATION))}
                  placeholder="e.g. a name or initials to embroider"
                  maxLength={MAX_PERSONALISATION}
                  className="input"
                  disabled={soldOut}
                />
                <p className="mt-1.5 text-xs text-muted">
                  {personalisation.length}/{MAX_PERSONALISATION} - we'll confirm details with you before anything is made.
                </p>
              </div>
            )}

            {!soldOut && (
              <div>
                <span className="label" id="qty-label">
                  Quantity
                </span>
                <div className="inline-flex items-center rounded-sm border border-beige-dark bg-white" role="group" aria-labelledby="qty-label">
                  <button
                    type="button"
                    onClick={() => changeQty(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex size-11 items-center justify-center text-charcoal disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxQty || 1}
                    value={quantity}
                    onChange={(e) => changeQty(Number.parseInt(e.target.value, 10) || 1)}
                    className="w-12 border-x border-beige-dark py-2.5 text-center text-sm [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => changeQty(quantity + 1)}
                    disabled={quantity >= maxQty}
                    className="flex size-11 items-center justify-center text-charcoal disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {inBag > 0 && <p className="mt-1.5 text-xs text-muted">You have {inBag} in your bag.</p>}
              </div>
            )}

            {formError && <Alert type="error">{formError}</Alert>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" className="flex-1" disabled={soldOut || available === 0}>
                <ShoppingBag className="size-4" aria-hidden />
                {soldOut ? 'Sold out' : available === 0 ? 'All available stock in bag' : 'Add to Bag'}
              </Button>
              <Button
                to={`/contact?product=${encodeURIComponent(product.name)}`}
                variant="outline"
                size="lg"
              >
                <MessageSquare className="size-4" aria-hidden /> Enquire
              </Button>
            </div>
          </form>

          <ul className="mt-10 space-y-4 border-t border-beige pt-6 text-sm text-charcoal/80">
            <li className="flex gap-3">
              <HandHeart className="mt-0.5 size-5 shrink-0 text-terracotta" strokeWidth={1.4} aria-hidden />
              Handmade in small numbers, so colours and fabric placement can vary slightly from the photos.
            </li>
            <li className="flex gap-3">
              <Scissors className="mt-0.5 size-5 shrink-0 text-terracotta" strokeWidth={1.4} aria-hidden />
              <span>
                Want a different fabric or colour?{' '}
                <Link to="/custom-order" className="text-terracotta underline-offset-4 hover:underline">
                  Request a custom creation
                </Link>
                .
              </span>
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-8 text-3xl text-charcoal sm:text-4xl">
            You May Also Love
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
