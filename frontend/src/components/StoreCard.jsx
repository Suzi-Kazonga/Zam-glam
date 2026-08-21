import { Link } from 'react-router-dom';

export default function StoreCard({ store }) {
  const name = store.name || 'Store';
  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/stores/${store.id}`} className="block">
        <div className="flex h-48 items-center justify-center bg-slate-50 p-8"><img src={store.logo_url || '/images/logos/mud.png'} alt={`${name} logo`} className="max-h-24 max-w-[80%] object-contain transition duration-500 group-hover:scale-105" /></div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Zambian store</p><h2 className="mt-1 text-xl font-bold text-slate-900">{name}</h2></div>
          <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Shop Now</span>
        </div>
      </Link>
    </article>
  );
}