// The footer on every public page.

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12"><div className="mx-auto grid max-w-7xl gap-8 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4"><div><Link to="/" className="text-lg font-bold text-slate-900">Zamglam</Link><p className="mt-3">Style that moves with you.</p></div><div><p className="font-semibold text-slate-900">Explore</p><div className="mt-3 space-y-2"><Link className="block hover:text-indigo-600" to="/about">About us</Link><Link className="block hover:text-indigo-600" to="/contact">Contact</Link></div></div><div><p className="font-semibold text-slate-900">Support</p><div className="mt-3 space-y-2"><Link className="block hover:text-indigo-600" to="/policies">Shipping & returns</Link><Link className="block hover:text-indigo-600" to="/policies#privacy">Privacy policy</Link></div></div><div><p className="font-semibold text-slate-900">Follow along</p><p className="mt-3">Instagram · Facebook · TikTok</p></div></div><p className="mx-auto mt-10 max-w-7xl text-xs text-slate-400">© {new Date().getFullYear()} Zamglam</p>
    </footer>
  );
}
