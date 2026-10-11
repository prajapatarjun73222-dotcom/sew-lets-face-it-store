import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';

export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const { items } = useWishlist();

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-4xl text-charcoal sm:text-5xl">Your Wishlist</h1>
      <p className="mt-2 text-sm text-muted">Saved on this device so you can come back to your favourites.</p>
      {items.length === 0 ? (
        <EmptyState icon={Heart} title="No favourites yet" action={<Button to="/shop">Browse the Collection</Button>}>
          Tap the heart on any piece to save it here.
        </EmptyState>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
