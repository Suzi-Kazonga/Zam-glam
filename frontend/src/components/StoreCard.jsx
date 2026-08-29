import { Link } from 'react-router-dom';
import { getStoreLogoTheme } from '../utils/storeLogos';

export default function StoreCard({ store }) {
  const name = store.name || 'Store';
  const theme = getStoreLogoTheme(name);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/stores/${store.id}`} className="flex h-full flex-col">
        <div className={`relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-100 px-8 ${theme.background}`}>
          <img
            src={theme.src}
            alt={`${name} logo`}
            className="h-28 w-full max-w-[240px] object-contain object-center"
          />
          <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">
            {name.toLowerCase().includes('jet') ? 'Express Delivery' : 'Verified Partner'}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Zambian store</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{name}</h2>
          </div>
          <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Shop Now</span>
        </div>
      </Link>
    </article>
  );
}
