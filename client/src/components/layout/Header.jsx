import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Instagram, Facebook } from '../ui/SocialIcons';
import Logo from '../ui/Logo';
import { mainNav } from './navigation';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

function isNavActive(location, to) {
  const [path, query] = to.split('?');
  if (path === '/') return location.pathname === '/';
  if (location.pathname !== path) return false;
  const current = new URLSearchParams(location.search).get('category') || '';
  const target = new URLSearchParams(query || '').get('category') || '';
  return current === target;
}

function IconLink({ to, label, count, children }) {
  return (
    <Link
      to={to}
      aria-label={count ? `${label} (${count})` : label}
      className="relative flex size-10 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-beige/50 hover:text-terracotta"
    >
      {children}
      {count > 0 && (
        <span className="absolute top-1 right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-forest px-1 text-[10px] leading-[18px] font-medium text-cream">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function SearchOverlay({ onClose }) {
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (event) => {
    event.preventDefault();
    const q = term.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search products">
      <button className="absolute inset-0 bg-charcoal/40" onClick={onClose} aria-label="Close search" />
      <div className="relative animate-fade-in border-b border-beige bg-cream py-8">
        <form onSubmit={submit} className="container-page flex items-center gap-3">
          <Search className="size-5 text-muted" aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            maxLength={100}
            placeholder="Search totes, handbags, embroidery…"
            className="flex-1 border-0 bg-transparent font-serif text-2xl text-charcoal placeholder:text-muted/60 focus:outline-none sm:text-3xl"
          />
          <button type="submit" className="rounded-sm bg-terracotta px-4 py-2 text-sm text-white hover:bg-terracotta-dark">
            Search
          </button>
          <button type="button" onClick={onClose} aria-label="Close search" className="p-2 text-muted hover:text-charcoal">
            <X className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MobileMenu({ onClose, location }) {
  const { settings } = useSettings();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Main menu">
      <button className="absolute inset-0 bg-charcoal/40" onClick={onClose} aria-label="Close menu" />
      <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col bg-cream shadow-xl">
        <div className="flex items-center justify-between border-b border-beige px-5 py-4">
          <Logo onClick={onClose} />
          <button onClick={onClose} aria-label="Close menu" className="p-2 text-charcoal">
            <X className="size-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-5 py-4">
          {mainNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onClose}
                className={`block border-b border-beige/70 py-4 font-serif text-2xl ${
                  isNavActive(location, item.to) ? 'text-terracotta' : 'text-charcoal'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {[
            { label: 'Custom Orders', to: '/custom-order' },
            { label: 'Contact', to: '/contact' },
            { label: 'Wishlist', to: '/wishlist' },
          ].map((item) => (
            <li key={item.to}>
              <Link to={item.to} onClick={onClose} className="block py-3 text-sm text-muted hover:text-terracotta">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-beige px-5 py-5 text-muted">
          <a href={settings.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-terracotta">
            <Instagram className="size-5" />
          </a>
          <a href={settings.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-terracotta">
            <Facebook className="size-5" />
          </a>
          <span className="ml-auto text-xs">Handmade in the UK</span>
        </div>
      </nav>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { count } = useCart();
  const wishlist = useWishlist();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-cream/95 backdrop-blur transition-shadow ${
        scrolled ? 'border-beige shadow-[0_4px_20px_-12px_rgba(41,40,36,0.25)]' : 'border-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center gap-4 sm:h-20">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="-ml-2 flex size-10 items-center justify-center lg:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <Menu className="size-5" />
        </button>

        <Logo className="max-lg:mx-auto max-lg:[&>span]:text-[1.65rem]" />

        <nav aria-label="Main" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-9">
            {mainNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={() =>
                    `link-underline text-[12px] font-medium tracking-[0.12em] uppercase transition-colors ${
                      isNavActive(location, item.to) ? 'text-terracotta after:w-full' : 'text-charcoal hover:text-terracotta'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-beige/50 hover:text-terracotta"
          >
            <Search className="size-[19px]" strokeWidth={1.6} />
          </button>
          <span className="hidden sm:block">
            <IconLink to={isAdmin ? '/admin' : '/account'} label={isAdmin ? 'Admin dashboard' : 'Account'}>
              <User className="size-[19px]" strokeWidth={1.6} />
            </IconLink>
          </span>
          <span className="hidden sm:block">
            <IconLink to="/wishlist" label="Wishlist" count={wishlist.count}>
              <Heart className="size-[19px]" strokeWidth={1.6} />
            </IconLink>
          </span>
          <IconLink to="/bag" label="Shopping bag" count={count}>
            <ShoppingBag className="size-[19px]" strokeWidth={1.6} />
          </IconLink>
        </div>
      </div>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} location={location} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
