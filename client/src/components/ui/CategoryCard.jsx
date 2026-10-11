import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { sizedImage } from '../../utils/format';

export default function CategoryCard({ category }) {
  return (
    <Link to={`/shop?category=${category.slug}`} className="group block text-center">
      <div className="aspect-[4/5] overflow-hidden rounded-sm bg-beige/50">
        {category.image ? (
          <img
            src={sizedImage(category.image, 500)}
            alt={`${category.name} - handmade by Sew Lets Face It`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-serif text-xl text-muted">{category.name}</div>
        )}
      </div>
      <h3 className="mt-3 font-sans text-sm font-medium tracking-normal text-charcoal">{category.name}</h3>
      <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted transition-colors group-hover:text-terracotta">
        Shop now <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-sm bg-beige/50" />
      <div className="mx-auto mt-3 h-3 w-2/3 rounded bg-beige/70" />
    </div>
  );
}
