// The section list beside every dashboard. On a phone it becomes a drawer opened by a
// floating Menu button.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStorefrontPath, getStoreLogo } from '../utils/storeLogos';
import { themeForRole } from '../utils/roleTheme';

const customerIconPaths = {
  Overview: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9ZM9 21v-6h6v6',
  Orders: 'M6 3h12v18l-6-3-6 3V3ZM9 8h6M9 12h6',
  Products: 'm4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10',
  Messages: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
  Cart: 'M3 3h2l2.4 12.2A2 2 0 0 0 9.4 17h8.8a2 2 0 0 0 2-1.6L22 8H6M10 21h.01M18 21h.01',
  Collections: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  Profile: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  Wishlist: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
};

export default function Sidebar({ items, active, onSelect, role, shopName, storefrontPath }) {
  const [open, setOpen] = useState(false);
  const storefront = storefrontPath || getStorefrontPath(shopName);
  const theme = themeForRole(role);
  const accent = theme.sidebarActive;

  // On a phone the drawer covers the page, so Escape and the backdrop both close it, and
  // the page behind does not scroll away underneath it.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const heading = role === 'admin' ? 'Admin console' : role === 'courier' ? 'Courier hub' : 'My Zamglam';

  return (
    <>
      {/* Out of the way of the header and of the page's own content, and big enough to hit. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open the menu"
        className={`fixed bottom-5 left-4 z-30 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg lg:hidden ${theme.button}`}
      >
        <span aria-hidden="true">☰</span> Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl transition-transform duration-200
                    lg:static lg:z-0 lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-md lg:transition-none`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Menu</p>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600">
            Close
          </button>
        </div>

        {role === 'seller' ? (
          <div className="mb-6 px-3">
            <img src={getStoreLogo(shopName)} alt="" className="mb-3 h-10 w-auto max-w-[140px] object-contain" />
            <p className="text-lg font-bold text-slate-900">{shopName || 'Seller'} studio</p>
            <Link to={storefront} onClick={() => setOpen(false)} className="mt-1 block text-sm font-semibold text-purple-700 hover:text-purple-900">
              View storefront
            </Link>
          </div>
        ) : (
          <p className="mb-6 px-3 text-lg font-bold text-slate-900">{heading}</p>
        )}

        <nav className="space-y-1">
          {items.map((item) => (
            <div key={item}>
              {role === 'customer' && item === 'Collections' && (
                <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Discover</p>
              )}
              {role === 'customer' && item === 'Profile' && (
                <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
              )}
              <button
                type="button"
                onClick={() => { onSelect(item); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition lg:py-2.5 ${
                  role === 'customer'
                    ? active === item
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-700 hover:bg-white/70'
                    : active === item ? accent : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {role === 'customer' && (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-slate-500">
                    <path d={customerIconPaths[item]} />
                  </svg>
                )}
                {item}
              </button>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
