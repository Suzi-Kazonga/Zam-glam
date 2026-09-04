import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getStorefrontPath, getStoreLogo } from '../utils/storeLogos';
import { themeForRole } from '../utils/roleTheme';

export default function Sidebar({ items, active, onSelect, role, shopName }) {
  const [open, setOpen] = useState(false);
  const storefront = getStorefrontPath(shopName);
  const accent = themeForRole(role).sidebarActive;
  return <>
    <button onClick={() => setOpen(!open)} className="fixed left-4 top-20 z-30 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white lg:hidden">{open ? 'Close' : 'Menu'}</button>
    <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-20 w-64 bg-white p-4 pt-24 shadow-md lg:static lg:block lg:pt-6`}>
      {role === 'seller' ? (
        <div className="mb-6 px-3">
          <img src={getStoreLogo(shopName)} alt="" className="mb-3 h-10 w-auto max-w-[140px] object-contain" />
          <p className="text-lg font-bold text-slate-900">{shopName || 'Seller'} studio</p>
          <Link to={storefront} className="mt-1 block text-sm font-semibold text-purple-700 hover:text-purple-900">View storefront</Link>
        </div>
      ) : (
        <p className="mb-6 px-3 text-lg font-bold text-slate-900">{role === 'admin' ? 'Admin console' : role === 'courier' ? 'Courier hub' : 'My Zamglam'}</p>
      )}
      <nav className="space-y-1">{items.map((item) => <button key={item} onClick={() => { onSelect(item); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${active === item ? accent : 'text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}</nav>
    </aside>
  </>;
}