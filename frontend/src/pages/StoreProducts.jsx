import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import apiClient from '../api/axios';
import { getStore, getStoreProducts } from '../api/storeApi';

export default function StoreProducts() {
  const { id } = useParams();
  const [store, setStore] = useState({ name: id === '1' ? 'Mud' : id === '2' ? 'Jets' : 'Bata' });
  const [activeStore, setActiveStore] = useState(id);
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState('all');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('newest');
    const logoFiles = { Mud: 'mud', Jets: 'jets', Bata: 'bata', Pep: 'pep', 'Mr Price Zambia': 'mrprice', 'Fashions Galore': 'fashionsgalore' };
    useEffect(() => {
      setActiveStore(id);
      Promise.all([getStore(id), getStoreProducts(id)]).then(([storeData, productData]) => {
        setStore(storeData);
        setProducts(Array.isArray(productData) ? productData : []);
      }).catch(() => {
        apiClient.get('/products', { params: { store_id: id } }).then(({ data }) => setProducts(Array.isArray(data) ? data : [])).catch(() => setProducts([]));
      });
    }, [id]);

    const filtered = useMemo(() => products.filter((product) => {
      const productCategory = String(product.category_name || product.category || '').toLowerCase();
      const matchesCategory = category === 'all' || (category === 'shoes' ? productCategory.includes('shoe') : !productCategory.includes('shoe'));
      return matchesCategory && (!maxPrice || Number(product.price) <= Number(maxPrice));
    }).sort((a, b) => sort === 'price-low' ? Number(a.price) - Number(b.price) : sort === 'price-high' ? Number(b.price) - Number(a.price) : Number(b.id) - Number(a.id)), [products, maxPrice, category, sort]);
    const logo = `/images/logos/${logoFiles[store.name] || 'mud'}.png`;

    return <main data-active-store={activeStore} className="mx-auto max-w-7xl px-4 py-12">
      <Link to="/" className="mb-6 inline-block text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">← Back to Stores</Link>
      <div className="flex flex-wrap items-end justify-between gap-4"><div className="flex items-center gap-4"><img src={store.logo_url || logo} alt={`${store.name} logo`} className="h-16 w-20 object-contain" /><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Store collection</p><h1 className="mt-2 text-4xl font-bold text-slate-900">{store.name} Store</h1></div></div><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-2"><option value="newest">Newest</option><option value="popularity">Popularity</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]"><aside className="h-fit rounded-lg bg-white p-5 shadow-md"><h2 className="font-bold">Filters</h2><label className="mt-5 block text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2"><option value="all">All</option><option value="clothes">Clothes</option><option value="shoes">Shoes</option></select></label><label className="mt-5 block text-sm font-medium">Max price<input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any price" className="mt-2 w-full rounded-lg border px-3 py-2" /></label><p className="mt-5 border-t pt-5 text-sm text-slate-500">Sizes: XS, S, M, L, XL<br />Colors: black, white, stone</p></aside><div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}{!filtered.length && <p className="col-span-full py-16 text-center text-slate-500">No products match these filters.</p>}</div></div>
    </main>;
}