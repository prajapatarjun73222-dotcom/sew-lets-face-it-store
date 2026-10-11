import SectionHeading from '../ui/SectionHeading';
import ProductCard, { ProductCardSkeleton } from '../ui/ProductCard';
import Alert from '../ui/Alert';
import useApi from '../../hooks/useApi';

export default function FeaturedCollection() {
  const { data, loading, error, reload } = useApi('/products/featured', { params: { limit: 8 } });
  const products = data?.products || [];

  return (
    <section className="container-page pb-16 sm:pb-24" aria-labelledby="featured-heading">
      <SectionHeading
        title={<span id="featured-heading">Featured Collection</span>}
        subtitle="A selection of our favourite handmade pieces"
        linkTo="/shop"
        linkLabel="View All Products"
      />
      {error ? (
        <Alert
          type="error"
          title="We couldn't load the featured collection"
          action={
            <button onClick={reload} className="text-sm font-medium underline">
              Try again
            </button>
          }
        >
          {error}
        </Alert>
      ) : !loading && products.length === 0 ? (
        <p className="text-sm text-muted">New pieces are on the way - check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </section>
  );
}
