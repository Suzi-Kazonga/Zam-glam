// Clothing and shoe categories that are present in the live catalogue.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreCard from '../components/StoreCard';
import apiClient from '../api/axios';

const categories = [
  { name: 'Men’s Fashion', icon: '👔', href: '/products?audience=men' },
  { name: 'Women’s Fashion', icon: '👗', href: '/products?audience=women' },
  { name: 'Shoes & Sneakers', icon: '👟', href: '/products?category=shoes' },
];

const categoryValue = (product) => String(product.category_name || product.category || '').trim();
const categorySlug = (value) => value.toLowerCase().replace(/[\s_]+/g, '-');
const genericTypes = new Set(['clothes', 'clothing', 'shoes', 'footwear', 'general']);

const fallbackStores = [
  { id: 1, name: 'Mud', logo_url: '/images/logos/mud.png' },
  { id: 2, name: 'Jets', logo_url: '/images/logos/jets.png' },
  { id: 3, name: 'Bata', logo_url: '/images/logos/bata.png' },
  { id: 4, name: 'Pep', logo_url: '/images/logos/pep.png' },
  { id: 5, name: 'Mr Price Zambia', logo_url: '/images/logos/mrprice.png' },
  { id: 6, name: 'Fashions Galore', logo_url: '/images/logos/fashionsgalore.png' },
];

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    apiClient.get('/products')
      .then(({ data }) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoadError('');
      })
      .catch(() => setLoadError('Could not load product categories. Please refresh and try again.'));
  }, []);

  const clothingTypes = useMemo(() => [...new Set(
    products.map(categoryValue).filter((type) => type && !genericTypes.has(type.toLowerCase())),
  )].sort((left, right) => left.localeCompare(right)), [products]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Categories Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Shop by Category</h1>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <span aria-hidden="true" className="mb-2 text-3xl">{category.icon}</span>
                <span className="text-center text-sm font-semibold">{category.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-900">Browse by clothing type</h2>
            {loadError && <p role="alert" className="mt-2 text-sm text-rose-700">{loadError}</p>}
            {clothingTypes.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {clothingTypes.map((type) => (
                  <Link
                    key={type}
                    to={`/products?category=${encodeURIComponent(categorySlug(type))}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                  >
                    {type}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Clothing types will appear here as shops add products.</p>
            )}
          </div>
        </div>
      </section>

      {/* Stores Section */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fallbackStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse All Products */}
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Or Browse All Products</h2>
          <Link
            to="/products"
            className="inline-block rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition"
          >
            View All Products →
          </Link>
        </div>
      </section>
    </main>
  );
}
