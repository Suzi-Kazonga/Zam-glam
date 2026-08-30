import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import StoreCard from '../components/StoreCard';
import FeaturedDeals from '../components/FeaturedDeals';
import { getAllStores } from '../api/storeApi';
import { withStoreLogos } from '../utils/storeLogos';

const fallbackStores = withStoreLogos([
  { id: 1, name: 'Mud' },
  { id: 2, name: 'Jets' },
  { id: 3, name: 'Bata' },
  { id: 4, name: 'Pep' },
  { id: 5, name: 'Mr Price Zambia' },
  { id: 6, name: 'Fashions Galore' },
]);

export default function Home() {
  const [stores, setStores] = useState(fallbackStores);

  useEffect(() => {
    getAllStores()
      .then((storesResponse) => {
        if (Array.isArray(storesResponse) && storesResponse.length) {
          setStores(withStoreLogos(storesResponse));
        }
      })
      .catch(() => setStores(fallbackStores));
  }, []);

  return (
    <>
      <HeroBanner />
      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Quick Navigation */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/collections"
              className="rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center text-white hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-2">Browse Collections</h3>
              <p className="text-indigo-100">Shop by category and discover new styles</p>
            </Link>
            <Link
              to="/products"
              className="rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center text-white hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-2">All Products</h3>
              <p className="text-emerald-100">Explore everything we have to offer</p>
            </Link>
            <Link
              to="#stores"
              className="rounded-lg bg-gradient-to-br from-orange-600 to-rose-600 p-8 text-center text-white hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-2">Featured Stores</h3>
              <p className="text-orange-100">Shop from your favorite brands</p>
            </Link>
          </div>
        </section>

        {/* Featured Stores */}
        <section id="stores" className="mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The Zamglam marketplace</p>
          <h2 className="mt-2 mb-8 text-3xl font-bold text-slate-900">Featured Stores</h2>
          <div className="grid items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>

        {/* Featured Deals */}
        <FeaturedDeals />

        {/* CTA Section */}
        <section className="mt-16 rounded-lg bg-slate-900 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Shopping Now</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">Discover thousands of products from top Zambian brands, all in one place.</p>
          <Link
            to="/products"
            className="inline-block rounded-lg bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-700 transition"
          >
            Shop Now →
          </Link>
        </section>
      </main>
    </>
  );
}
