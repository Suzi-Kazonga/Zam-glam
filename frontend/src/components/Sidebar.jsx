import { useState } from 'react';

export default function Sidebar({ items, active, onSelect, role }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(!open)} className="fixed left-4 top-20 z-30 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white lg:hidden">{open ? 'Close' : 'Menu'}</button>
    <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-20 w-64 bg-white p-4 pt-24 shadow-md lg:static lg:block lg:pt-6`}>
      <p className="mb-6 px-3 text-lg font-bold text-slate-900">{role === 'seller' ? 'Seller studio' : 'My Zamglam'}</p>
      <nav className="space-y-1">{items.map((item) => <button key={item} onClick={() => { onSelect(item); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${active === item ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}</nav>
    </aside>
  </>;
}