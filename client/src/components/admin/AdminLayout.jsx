import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, Inbox, Users, Settings, LogOut, ExternalLink, Menu, X, Receipt, Scissors } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Spinner';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const nav = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', Icon: Receipt },
  { to: '/admin/classes', label: 'Classes', Icon: Scissors },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/categories', label: 'Categories', Icon: FolderTree },
  { to: '/admin/enquiries', label: 'Enquiries', Icon: Inbox },
  { to: '/admin/subscribers', label: 'Newsletter', Icon: Users },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-forest text-cream">
      <div className="px-6 py-6">
        <Link to="/admin" onClick={onNavigate} className="font-script text-3xl leading-none">
          Sew Lets Face It
        </Link>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-cream/60 uppercase">Shop admin</p>
      </div>
      <nav className="flex-1 px-3" aria-label="Admin">
        <ul className="space-y-1">
          {nav.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-cream/15 text-white' : 'text-cream/75 hover:bg-cream/10 hover:text-white'
                  }`
                }
              >
                <Icon className="size-4" strokeWidth={1.6} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-cream/15 px-3 py-4 text-sm">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-sm px-3 py-2 text-cream/75 hover:bg-cream/10 hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden /> View website
        </a>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-cream/75 hover:bg-cream/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-cream/50">{user?.email}</p>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  useDocumentTitle('Admin');
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <Sidebar />
      </aside>

      <div className="flex items-center justify-between border-b border-beige bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-2">
          <Menu className="size-5" />
        </button>
        <span className="font-script text-2xl">Shop admin</span>
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-charcoal/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-left">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-3 z-10 p-2 text-cream" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
