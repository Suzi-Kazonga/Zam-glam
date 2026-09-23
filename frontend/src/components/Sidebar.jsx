// The section list beside every dashboard. On a phone it becomes a drawer opened by a
// floating Menu button.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStorefrontPath, getStoreLogo } from '../utils/storeLogos';
import { themeForRole } from '../utils/roleTheme';

export default function Sidebar({ items, active, onSelect, role, shopName }) {
  const [open, setOpen] = useState(false);
  const storefront = getStorefrontPath(shopName);
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
            <button
              key={item}
              type="button"
              onClick={() => { onSelect(item); setOpen(false); }}
              className={`block w-full rounded-lg px-3 py-3 text-left text-sm font-medium lg:py-2 ${active === item ? accent : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
