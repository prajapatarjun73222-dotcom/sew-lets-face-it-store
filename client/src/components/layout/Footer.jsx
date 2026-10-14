import { Link } from 'react-router-dom';
import { Mail, ShoppingBag } from 'lucide-react';
import { Instagram, Facebook } from '../ui/SocialIcons';
import Logo from '../ui/Logo';
import { shopLinks } from './navigation';
import { useSettings } from '../../context/SettingsContext';

function Column({ title, children }) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.18em] text-charcoal uppercase">{title}</h2>
      <ul className="space-y-2.5 text-sm text-muted">{children}</ul>
    </div>
  );
}

function BranchIllustration() {
  return (
    <svg viewBox="0 0 120 200" fill="none" className="h-40 w-auto text-sage/60" aria-hidden>
      <path d="M60 195C60 140 62 90 78 20" stroke="currentColor" strokeWidth="1.2" />
      {[150, 120, 90, 60, 35].map((y, i) => (
        <g key={y}>
          <path d={`M${61 + i * 3} ${y}c-18-4-30-16-34-30 16 2 30 14 34 30z`} stroke="currentColor" strokeWidth="1.1" />
          <path d={`M${63 + i * 3} ${y - 12}c16-6 26-20 28-34-14 4-26 18-28 34z`} stroke="currentColor" strokeWidth="1.1" />
        </g>
      ))}
    </svg>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-beige bg-cream">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{settings.brandDescription}</p>
          <div className="mt-5 flex gap-3">
            <a
              href={settings.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Sew Lets Face It on Instagram"
              className="flex size-9 items-center justify-center rounded-full border border-beige-dark text-charcoal transition-colors hover:border-terracotta hover:text-terracotta"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={settings.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Sew Lets Face It on Facebook"
              className="flex size-9 items-center justify-center rounded-full border border-beige-dark text-charcoal transition-colors hover:border-terracotta hover:text-terracotta"
            >
              <Facebook className="size-4" />
            </a>
            {settings.social.etsy && (
              <a
                href={settings.social.etsy}
                target="_blank"
                rel="noreferrer"
                aria-label="Sew Lets Face It on Etsy"
                className="flex size-9 items-center justify-center rounded-full border border-beige-dark text-charcoal transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <ShoppingBag className="size-4" />
              </a>
            )}
          </div>
        </div>

        <Column title="Shop">
          <li>
            <Link to="/shop" className="hover:text-terracotta">
              Shop All
            </Link>
          </li>
          {shopLinks.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="hover:text-terracotta">
                {link.label}
              </Link>
            </li>
          ))}
        </Column>

        <Column title="Customer Care">
          <li>
            <Link to="/our-story" className="hover:text-terracotta">
              Our Story
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-terracotta">
              Contact Us
            </Link>
          </li>
          <li>
            <Link to="/custom-order" className="hover:text-terracotta">
              Custom Orders
            </Link>
          </li>
          <li>
            <Link to="/sewing-classes" className="hover:text-terracotta">
              Sewing Classes
            </Link>
          </li>
          <li>
            <Link to="/orders/track" className="hover:text-terracotta">
              Track Your Order
            </Link>
          </li>
          <li>
            <Link to="/wishlist" className="hover:text-terracotta">
              Wishlist
            </Link>
          </li>
        </Column>

        <Column title="Connect">
          <li>
            <a href={settings.social.instagram} target="_blank" rel="noreferrer" className="hover:text-terracotta">
              Instagram
            </a>
          </li>
          <li>
            <a href={settings.social.facebook} target="_blank" rel="noreferrer" className="hover:text-terracotta">
              Facebook
            </a>
          </li>
          {settings.social.etsy && (
            <li>
              <a href={settings.social.etsy} target="_blank" rel="noreferrer" className="hover:text-terracotta">
                Etsy shop
              </a>
            </li>
          )}
          {settings.contactEmail && (
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-1.5 break-all hover:text-terracotta">
                <Mail className="size-3.5 shrink-0" aria-hidden /> {settings.contactEmail}
              </a>
            </li>
          )}
        </Column>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-10 hidden xl:block">
        <BranchIllustration />
      </div>

      <div className="border-t border-beige">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {year} {settings.brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-terracotta">
              Privacy Policy
            </Link>
            <span aria-hidden>|</span>
            <Link to="/terms" className="hover:text-terracotta">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
