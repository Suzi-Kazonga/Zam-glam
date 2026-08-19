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

// "Shoes", "Shirts", "Pants"… come from the product's real category. Fall back to reading
// the name so bundled sample products still group sensibly.
const productType = (product) => {
  const explicit = product.category_name || product.category;
  if (explicit) return String(explicit).replace(/^\w/, (c) => c.toUpperCase());
  return /shoe|sneaker|sandal|boot/i.test(`${product.name}`) ? 'Shoes' : 'Clothes';
};

export default function Products() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState(() => mergeShopProducts());
  const [selectedType, setSelectedType] = useState(params.get('category') === 'shoes' ? 'Shoes' : 'All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [collection, setCollection] = useState('all');
  const search = params.get('search') || '';

  useEffect(() => {
    apiClient.get('/products')
      .then(({ data }) => setProducts(mergeShopProducts(Array.isArray(data) ? data : [])))
      .catch(() => setProducts(mergeShopProducts()));
  }, []);

  // Offer only the types actually present in the catalogue.
  const types = useMemo(
    () => ['All', ...[...new Set(products.map(productType))].sort()],
    [products],
  );

  const priceCap = useMemo(
    () => products.reduce((highest, product) => Math.max(highest, Number(product.price) || 0), 0),
    [products],
  );

  const filtered = useMemo(() => {
    const min = minPrice === '' ? 0 : Number(minPrice);
    const max = maxPrice === '' ? Infinity : Number(maxPrice);

    const result = products.filter((product) => {
      const searchable = `${product.name} ${product.description || ''} ${product.store_name || ''} ${productType(product)}`.toLowerCase();
      const price = Number(product.price) || 0;
      const matchesSearch = searchable.includes(search.toLowerCase());
      const matchesType = selectedType === 'All' || productType(product) === selectedType;
      const matchesPrice = price >= min && price <= max;
      const matchesCollection = collection === 'all'
        || (collection === 'new' ? isNewProduct(product) : getProductClickCount(product.id) > 0);
      return matchesSearch && matchesType && matchesPrice && matchesCollection;
    });

    return result.sort((a, b) => (
      sort === 'price-low' ? Number(a.price) - Number(b.price)
        : sort === 'price-high' ? Number(b.price) - Number(a.price)
          : sort === 'trending' ? getProductClickCount(b.id) - getProductClickCount(a.id)
            : new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
    ));
  }, [products, search, selectedType, minPrice, maxPrice, collection, sort]);

  const clearFilters = () => {
    setSelectedType('All');
    setMinPrice('');
    setMaxPrice('');
    setCollection('all');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Shop now</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Everything from every store</h1>
          <p className="mt-1 text-slate-500">Clothing and footwear from all registered Zambian shops, in one list.</p>
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
          <option value="newest">Newest first</option>
          <option value="trending">Trending</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[['all', 'All'], ['new', 'New in 24 hours'], ['trending', 'Trending']].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setCollection(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${collection === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-lg bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Filters</h2>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Clear</button>
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-600">Type
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2">
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-slate-600">Price (ZMW)</legend>
            <div className="mt-2 flex items-center gap-2">
              <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min" aria-label="Minimum price" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <span className="text-slate-400">–</span>
              <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max" aria-label="Maximum price" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            {priceCap > 0 && (
              <input
                type="range"
                min="0"
                max={Math.ceil(priceCap)}
                value={maxPrice === '' ? Math.ceil(priceCap) : maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                aria-label="Maximum price slider"
                className="mt-3 w-full accent-indigo-600"
              />
            )}
            <p className="mt-1 text-xs text-slate-400">
              {maxPrice === '' ? `Up to K${Math.ceil(priceCap)}` : `Under K${Number(maxPrice).toFixed(0)}`}
            </p>
          </fieldset>

          <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
            {filtered.length} item{filtered.length === 1 ? '' : 's'} match
          </p>
        </aside>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
          {!filtered.length && <p className="col-span-full py-16 text-center text-slate-500">No products match those filters.</p>}
        </div>
      </div>
    </main>
  );
}
