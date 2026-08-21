import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';
import HeroBanner from '../components/HeroBanner';
import ProductCard from '../components/ProductCard';
import StoreCard from '../components/StoreCard';
import FeaturedDeals from '../components/FeaturedDeals';
import { getAllStores } from '../api/storeApi';
import apiClient from '../api/axios';

const fallbackStores = [{ name: 'Mud', file: 'mud' }, { name: 'Jets', file: 'jets' }, { name: 'Bata', file: 'bata' }, { name: 'Pep', file: 'pep' }, { name: 'Mr Price Zambia', file: 'mrprice' }, { name: 'Fashions Galore', file: 'fashionsgalore' }].map((store, id) => ({ id: id + 1, name: store.name, logo_url: `/images/logos/${store.file}.png` }));

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState(fallbackStores);
  useEffect(() => { Promise.all([apiClient.get('/products'), getAllStores()]).then(([productsResponse, storesResponse]) => { setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []); if (Array.isArray(storesResponse) && storesResponse.length) setStores(storesResponse); }).catch(() => setProducts([])); }, []);
  const featured = useMemo(() => products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [products, search]);
  return <><HeroBanner /><CategoryNav /><main className="mx-auto max-w-7xl px-4 py-12"><section><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The Zamglam marketplace</p><h2 className="mt-2 text-3xl font-bold text-slate-900">Choose your store</h2><div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">{stores.map((store) => <StoreCard key={store.id} store={store} />)}</div></section><FeaturedDeals /><section className="mt-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Curated for you</p><h2 className="mt-2 text-3xl font-bold text-slate-900">Trending now</h2></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter featured styles" className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 sm:w-64" /></div><div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{featured.length ? featured.map((product) => <ProductCard key={product.id} product={product} />) : <p className="col-span-full py-12 text-center text-slate-500">No products are available yet.</p>}</div><div className="mt-10 text-center"><Link to="/products" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-indigo-600 hover:text-indigo-600">View all products</Link></div></section></main></>;
}
