import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import apiClient from '../api/axios';
import { mergeShopProducts } from '../utils/shopCatalog';
import { getProductClickCount } from '../utils/productStore';

const isNewProduct = (product) => {
  const createdAt = product.createdAt || product.created_at;
  return createdAt && Date.now() - new Date(createdAt).getTime() <= 24 * 60 * 60 * 1000;
};

export default function Products() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState(() => mergeShopProducts());
  const initialCategory = params.get('category') === 'shoes' ? 'Shoes' : params.get('category') ? 'Clothes' : 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [collection, setCollection] = useState('all');
  const search = params.get('search') || '';
  useEffect(() => {
    setProducts(mergeShopProducts());
    apiClient.get('/products').then(({ data }) => setProducts(mergeShopProducts(Array.isArray(data) ? data : []))).catch(() => setProducts(mergeShopProducts()));
  }, []);
  const filtered = useMemo(() => { const result = products.filter((product) => { const searchable = `${product.name} ${product.description || ''} ${product.category_name || product.category || ''}`.toLowerCase(); const productCategory = searchable.includes('shoe') ? 'Shoes' : 'Clothes'; const matchesSearch = searchable.includes(search.toLowerCase()); const matchesCategory = selectedCategory === 'All' || productCategory === selectedCategory; const matchesCollection = collection === 'all' || (collection === 'new' ? isNewProduct(product) : getProductClickCount(product.id) > 0); return matchesSearch && matchesCategory && matchesCollection; }); return result.sort((a, b) => sort === 'price-low' ? Number(a.price) - Number(b.price) : sort === 'price-high' ? Number(b.price) - Number(a.price) : sort === 'trending' ? getProductClickCount(b.id) - getProductClickCount(a.id) : new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)); }, [products, search, selectedCategory, collection, sort]);
  return <main className="mx-auto max-w-7xl px-4 py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Shop now</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Find your next favorite</h1></div><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm"><option value="newest">Newest first</option><option value="trending">Trending</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => setCollection('all')} className={`rounded-full px-4 py-2 text-sm font-semibold ${collection === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button><button type="button" onClick={() => setCollection('new')} className={`rounded-full px-4 py-2 text-sm font-semibold ${collection === 'new' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>New in 24 hours</button><button type="button" onClick={() => setCollection('trending')} className={`rounded-full px-4 py-2 text-sm font-semibold ${collection === 'trending' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Trending</button></div><div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]"><aside className="h-fit rounded-lg bg-white p-5 shadow-md"><h2 className="font-bold text-slate-900">Filters</h2><label className="mt-5 block text-sm font-medium text-slate-600">Category<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"><option>All</option><option>Clothes</option><option>Shoes</option></select></label><div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">Size: XS · S · M · L · XL<br />Color: Black · White · Stone</div></aside><div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}{!filtered.length && <p className="col-span-full py-16 text-center text-slate-500">No products match those filters.</p>}</div></div></main>;
}
