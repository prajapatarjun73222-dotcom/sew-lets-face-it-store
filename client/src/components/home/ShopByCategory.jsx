import SectionHeading from '../ui/SectionHeading';
import CategoryCard, { CategoryCardSkeleton } from '../ui/CategoryCard';
import Alert from '../ui/Alert';
import useApi from '../../hooks/useApi';

export default function ShopByCategory() {
  const { data, loading, error, reload } = useApi('/categories');
  const categories = data?.categories || [];

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="categories-heading">
      <SectionHeading
        title={<span id="categories-heading">Shop by Category</span>}
        subtitle="Explore our handmade bags and accessories"
      />
      {error ? (
        <Alert
          type="error"
          title="We couldn't load the categories"
          action={
            <button onClick={reload} className="text-sm font-medium underline">
              Try again
            </button>
          }
        >
          {error}
        </Alert>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <CategoryCardSkeleton key={i} />)
            : categories.map((category) => <CategoryCard key={category._id} category={category} />)}
        </div>
      )}
    </section>
  );
}
