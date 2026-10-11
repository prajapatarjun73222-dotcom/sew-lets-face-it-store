import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, SearchX, Search } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';
import ProductCard, { ProductCardSkeleton } from '../components/ui/ProductCard';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PAGE_SIZE = 9;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];
const PRICE_PRESETS = [
  { label: 'Under £15', min: '', max: '15' },
  { label: '£15 - £25', min: '15', max: '25' },
  { label: '£25 - £35', min: '25', max: '35' },
  { label: 'Over £35', min: '35', max: '' },
];

function Filters({ categories, params, setParam, toggleCategory, clearAll }) {
  const selected = (params.get('category') || '').split(',').filter(Boolean);
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');

  useEffect(() => {
    setMin(params.get('minPrice') || '');
    setMax(params.get('maxPrice') || '');
  }, [params]);

  const applyPrice = (event) => {
    event.preventDefault();
    const lo = min === '' ? '' : Math.max(0, Number(min));
    const hi = max === '' ? '' : Math.max(0, Number(max));
    if (lo !== '' && hi !== '' && lo > hi) {
      setParam({ minPrice: String(hi), maxPrice: String(lo) });
    } else {
      setParam({ minPrice: lo === '' ? '' : String(lo), maxPrice: hi === '' ? '' : String(hi) });
    }
  };

  const activeCount =
    selected.length + (params.get('minPrice') || params.get('maxPrice') ? 1 : 0) + (params.get('inStock') === 'true' ? 1 : 0);

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold tracking-[0.18em] text-charcoal uppercase">Category</legend>
        <ul className="space-y-2.5">
          {categories.map((category) => (
            <li key={category._id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal/85 hover:text-terracotta">
                <input
                  type="checkbox"
                  checked={selected.includes(category.slug)}
                  onChange={() => toggleCategory(category.slug)}
                  className="size-4 rounded-sm border-beige-dark accent-terracotta"
                />
                <span className="flex-1">{category.name}</span>
                <span className="text-xs text-muted">{category.productCount}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold tracking-[0.18em] text-charcoal uppercase">Price</legend>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = (params.get('minPrice') || '') === preset.min && (params.get('maxPrice') || '') === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setParam(active ? { minPrice: '', maxPrice: '' } : { minPrice: preset.min, maxPrice: preset.max })}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active ? 'border-terracotta bg-terracotta text-white' : 'border-beige-dark text-charcoal hover:border-terracotta'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={applyPrice} className="flex items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] text-muted">Min £</span>
            <input type="number" min="0" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className="input py-2" />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-[11px] text-muted">Max £</span>
            <input type="number" min="0" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} className="input py-2" />
          </label>
          <button type="submit" className="rounded-sm border border-charcoal px-3 py-2 text-xs font-medium hover:bg-charcoal hover:text-cream">
            Apply
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold tracking-[0.18em] text-charcoal uppercase">Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal/85">
          <input
            type="checkbox"
            checked={params.get('inStock') === 'true'}
            onChange={(e) => setParam({ inStock: e.target.checked ? 'true' : '' })}
            className="size-4 accent-terracotta"
          />
          In stock only
        </label>
      </fieldset>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="text-sm text-terracotta underline-offset-4 hover:underline">
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState(params.get('search') || '');
  const { data: categoryData } = useApi('/categories');
  const categories = useMemo(() => categoryData?.categories || [], [categoryData]);

  const query = useMemo(() => {
    const q = {};
    for (const key of ['search', 'category', 'minPrice', 'maxPrice', 'inStock', 'sort']) {
      const value = params.get(key);
      if (value) q[key] = value;
    }
    return q;
  }, [params]);
  const queryKey = JSON.stringify(query);

  const selectedCategories = (params.get('category') || '').split(',').filter(Boolean);
  const selectedNames = categories.filter((c) => selectedCategories.includes(c.slug)).map((c) => c.name);
  const heading =
    selectedNames.length === 1 ? selectedNames[0] : selectedCategories.join(',') === 'toiletry-bags,phone-cases' ? 'Accessories' : 'Shop All';
  useDocumentTitle(heading, `Browse ${heading.toLowerCase()} - handmade bags and accessories by Sew Lets Face It.`);

  useEffect(() => setSearchTerm(params.get('search') || ''), [params]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    api
      .get('/products', { params: { ...JSON.parse(queryKey), page: 1, limit: PAGE_SIZE }, signal: controller.signal })
      .then(({ data }) => {
        setProducts(data.products);
        setPagination(data.pagination);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        setError(getErrorMessage(err));
        setStatus('error');
      });
    return () => controller.abort();
  }, [queryKey, retryKey]);

  const loadMore = async () => {
    if (!pagination?.hasMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/products', { params: { ...query, page: pagination.page + 1, limit: PAGE_SIZE } });
      setProducts((list) => [...list, ...data.products.filter((p) => !list.some((x) => x._id === p._id))]);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const setParam = useCallback(
    (updates) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const toggleCategory = (slug) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug];
    setParam({ category: next.join(',') });
  };

  const clearAll = () => setParams(params.get('search') ? { search: params.get('search') } : {}, { replace: true });

  const submitSearch = (event) => {
    event.preventDefault();
    setParam({ search: searchTerm.trim() });
  };

  const filterProps = { categories, params, setParam, toggleCategory, clearAll };

  return (
    <div className="pb-20">
      <section className="border-b border-beige bg-cream-dark">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow mb-2">The Collection</p>
          <h1 className="text-4xl text-charcoal sm:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Every piece is handmade in small numbers. Prices shown are for this demo and may change.
          </p>
        </div>
      </section>

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-28">
            <Filters {...filterProps} />
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={submitSearch} className="relative w-full sm:max-w-xs" role="search">
              <label htmlFor="shop-search" className="sr-only">
                Search products
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="shop-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => searchTerm.trim() !== (params.get('search') || '') && setParam({ search: searchTerm.trim() })}
                placeholder="Search products"
                maxLength={100}
                className="input pl-9"
              />
            </form>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-sm border border-beige-dark px-3.5 py-2.5 text-sm lg:hidden"
              >
                <SlidersHorizontal className="size-4" aria-hidden /> Filters
              </button>
              <label htmlFor="sort" className="sr-only">
                Sort products
              </label>
              <select
                id="sort"
                value={params.get('sort') || 'newest'}
                onChange={(e) => setParam({ sort: e.target.value === 'newest' ? '' : e.target.value })}
                className="input w-auto py-2.5 pr-8"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort: {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(params.get('search') || selectedNames.length > 0) && (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
              {params.get('search') && (
                <button
                  type="button"
                  onClick={() => setParam({ search: '' })}
                  className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5 hover:bg-beige"
                >
                  Search: “{params.get('search')}” <X className="size-3" aria-label="Remove" />
                </button>
              )}
              {categories
                .filter((c) => selectedCategories.includes(c.slug))
                .map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCategory(c.slug)}
                    className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5 hover:bg-beige"
                  >
                    {c.name} <X className="size-3" aria-label="Remove" />
                  </button>
                ))}
            </div>
          )}

          {status === 'error' ? (
            <Alert type="error" title="We couldn't load the products">
              {error}{' '}
              <button onClick={() => setRetryKey((k) => k + 1)} className="font-medium underline">
                Try again
              </button>
            </Alert>
          ) : status === 'loading' ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No pieces found"
              action={
                <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                  Clear search &amp; filters
                </Button>
              }
            >
              We couldn't find anything matching your search or filters. Try something broader - or{' '}
              <Link to="/custom-order" className="text-terracotta underline">
                ask about a custom creation
              </Link>
              .
            </EmptyState>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted" aria-live="polite">
                Showing {products.length} of {pagination.total} {pagination.total === 1 ? 'piece' : 'pieces'}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              {pagination.hasMore && (
                <div className="mt-10 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? <Spinner className="size-4" /> : null}
                    Load more
                  </Button>
                </div>
              )}
              {error && status === 'ready' && (
                <Alert type="error" className="mt-6">
                  {error}
                </Alert>
              )}
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-charcoal/40" onClick={() => setDrawerOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm animate-slide-in-right flex-col bg-cream shadow-xl">
            <div className="flex items-center justify-between border-b border-beige px-5 py-4">
              <h2 className="text-2xl">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-2">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <Filters {...filterProps} />
            </div>
            <div className="border-t border-beige p-4">
              <Button className="w-full" onClick={() => setDrawerOpen(false)}>
                Show {pagination?.total ?? ''} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
