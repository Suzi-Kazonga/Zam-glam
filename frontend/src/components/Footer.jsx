export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12"><div className="mx-auto grid max-w-7xl gap-8 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-lg font-bold text-slate-900">Zamglam</p><p className="mt-3">Style that moves with you.</p></div><div><p className="font-semibold text-slate-900">Explore</p><div className="mt-3 space-y-2"><a className="block hover:text-indigo-600" href="/about">About us</a><a className="block hover:text-indigo-600" href="/contact">Contact</a></div></div><div><p className="font-semibold text-slate-900">Support</p><div className="mt-3 space-y-2"><a className="block hover:text-indigo-600" href="/policies">Shipping & returns</a><a className="block hover:text-indigo-600" href="/policies#privacy">Privacy policy</a></div></div><div><p className="font-semibold text-slate-900">Payments</p><p className="mt-3">Airtel Money · MTN MoMo · Card</p></div></div><p className="mx-auto mt-10 max-w-7xl text-xs text-slate-400">© {new Date().getFullYear()} Zamglam</p>
    </footer>
  );
}
