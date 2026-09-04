import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import apiClient from '../api/axios';
import { getStore, getStoreProducts } from '../api/storeApi';
import { getSellerScore } from '../utils/ratingStore';
import pepClothes from '../data/pep/clothes.json';
import pepShoes from '../data/pep/shoes.json';
import jetsClothes from '../data/jets/clothes.json';
import jetsShoes from '../data/jets/shoes.json';
import bataClothes from '../data/bata/clothes.json';
import bataShoes from '../data/bata/shoes.json';
import mudClothes from '../data/mud/clothes.json';
import mudShoes from '../data/mud/shoes.json';
import mrpriceClothes from '../data/mrprice/clothes.json';
import mrpriceShoes from '../data/mrprice/shoes.json';
import fashionsClothes from '../data/fashionsgalore/clothes.json';
import fashionsShoes from '../data/fashionsgalore/shoes.json';

const storeCatalogs = {
  1: { name: 'Mud', clothes: mudClothes, shoes: mudShoes },
  2: { name: 'Jets', clothes: jetsClothes, shoes: jetsShoes },
  3: { name: 'Bata', clothes: bataClothes, shoes: bataShoes },
  4: { name: 'Pep', clothes: pepClothes, shoes: pepShoes },
  5: { name: 'Mr Price Zambia', clothes: mrpriceClothes, shoes: mrpriceShoes },
  6: { name: 'Fashions Galore', clothes: fashionsClothes, shoes: fashionsShoes },
};

export default function StoreCatalog() {
  const { id } = useParams();
  const fallbackCatalog = storeCatalogs[id] || storeCatalogs[1];
  const [activeStore, setActiveStore] = useState(id);
  const [store, setStore] = useState({ name: fallbackCatalog.name });
  // Bundled sample products are shown only until the real catalogue loads, and are marked
  // unavailable because the backend has no such products to sell.
  const sampleProducts = (catalog) => [...catalog.clothes, ...catalog.shoes].map((product) => ({ ...product, unavailable: true }));
  const [products, setProducts] = useState(() => sampleProducts(fallbackCatalog));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    setActiveStore(id);
    const catalog = storeCatalogs[id] || storeCatalogs[1];
    setProducts(sampleProducts(catalog));
    setStore({ name: catalog.name });

    Promise.allSettled([getStore(id), getStoreProducts(id)]).then(([storeResult, productsResult]) => {
      if (storeResult.status === 'fulfilled' && storeResult.value) setStore(storeResult.value);
      if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value) && productsResult.value.length) {
        setProducts(productsResult.value);
        return;
      }
      apiClient.get('/products', { params: { store_id: id } }).then(({ data }) => {
        if (Array.isArray(data) && data.length) setProducts(data);
      }).catch(() => {});
    });
  }, [id]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (selectedCategory === 'All') return true;
    return String(product.category_name || product.category || '').toLowerCase().includes(selectedCategory.toLowerCase().slice(0, -1));
  }).sort((a, b) => priceRange === 'low' ? Number(a.price) - Number(b.price) : priceRange === 'high' ? Number(b.price) - Number(a.price) : 0), [products, selectedCategory, priceRange]);

  return (
    <main data-active-store={activeStore} className="mx-auto max-w-7xl px-4 py-12">
      <Link to="/" className="mb-6 inline-block text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">← Back to Stores</Link>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Store catalog</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">{store.name} Store</h1>
          <p className="mt-2 text-slate-500">Clothes and shoes selected from {store.name}.</p>
          {getSellerScore(store.name).count > 0 && (
            <p className="mt-2 text-sm text-amber-600">★ {getSellerScore(store.name).average} average from {getSellerScore(store.name).count} customer rating{getSellerScore(store.name).count === 1 ? '' : 's'}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1" aria-label="Product category">
          {['All', 'Clothes', 'Shoes'].map((category) => (
            <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${selectedCategory === category ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              {category}
            </button>
          ))}
        </div>
          <label className="mt-5 block text-sm font-medium text-slate-600">Price
            <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="all">All prices</option><option value="low">Low to high</option><option value="high">High to low</option></select>
          </label>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        {!filteredProducts.length && <p className="col-span-full py-16 text-center text-slate-500">No products match this category.</p>}
      </div>
    </main>
  );
}
