import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import StoreCard from '../components/StoreCard';
import FeaturedDeals from '../components/FeaturedDeals';
import { getAllStores } from '../api/storeApi';
import { withStoreLogos, getStoreLogo, getStorefrontPath } from '../utils/storeLogos';
import { useAuth } from '../context/AuthContext';

const fallbackStores = withStoreLogos([
  { id: 1, name: 'Mud' },
  { id: 2, name: 'Jets' },
  { id: 3, name: 'Bata' },
  { id: 4, name: 'Pep' },
  { id: 5, name: 'Mr Price Zambia' },
  { id: 6, name: 'Fashions Galore' },
]);

// A seller lands on their own shop, not on a marketplace ad rotating other people's
// products — their store logo takes the place of the carousel.
function SellerStoreBanner({ shopName }) {
  const logo = getStoreLogo(shopName);
  return (
    <section className="relative min-h-[340px] overflow-hidden bg-slate-900">
      {/* The store's own logo, zoomed in and blurred, is the backdrop. */}
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-150 object-cover blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-slate-900/25" />
      <div className="relative mx-auto flex min-h-[340px] max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:flex-row sm:text-left">
        <img
          src={logo}
          alt={`${shopName} logo`}
          className="h-28 w-auto max-w-[240px] rounded-lg bg-white/95 object-contain p-3 shadow-2xl"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-200">Your storefront</p>
          <h1 className="mt-2 text-4xl font-bold text-white drop-shadow sm:text-5xl">{shopName}</h1>
          <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link to="/seller/dashboard" className="rounded-lg bg-purple-700 px-5 py-2 font-semibold text-white hover:bg-purple-800">Open dashboard</Link>
            <Link to={getStorefrontPath(shopName)} className="rounded-lg border border-white/60 px-5 py-2 font-semibold text-white hover:bg-white/10">View my shop</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const shopName = user?.shop_name || user?.name || 'My Shop';
  const [stores, setStores] = useState(fallbackStores);

  useEffect(() => {
    if (isSeller) return;
    getAllStores()
      .then((storesResponse) => {
        if (Array.isArray(storesResponse) && storesResponse.length) {
          setStores(withStoreLogos(storesResponse));
        }
      })
      .catch(() => setStores(fallbackStores));
  }, [isSeller]);

  return (
    <>
      {isSeller ? <SellerStoreBanner shopName={shopName} /> : <HeroBanner />}
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
            {isSeller ? (
              <Link
                to="/seller/dashboard"
                className="rounded-lg bg-gradient-to-br from-purple-700 to-fuchsia-600 p-8 text-center text-white hover:shadow-lg transition"
              >
                <h3 className="text-2xl font-bold mb-2">My Products</h3>
                <p className="text-purple-100">Add, edit and restock your listings</p>
              </Link>
            ) : (
              <Link
                to="#stores"
                className="rounded-lg bg-gradient-to-br from-orange-600 to-rose-600 p-8 text-center text-white hover:shadow-lg transition"
              >
                <h3 className="text-2xl font-bold mb-2">Featured Stores</h3>
                <p className="text-orange-100">Shop from your favorite brands</p>
              </Link>
            )}
          </div>
        </section>

        {/* Featured Stores — hidden from sellers, who should see their own shop, not rivals */}
        {!isSeller && (
          <section id="stores" className="mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The Zamglam marketplace</p>
            <h2 className="mt-2 mb-8 text-3xl font-bold text-slate-900">Featured Stores</h2>
            <div className="grid items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Deals */}
        {!isSeller && <FeaturedDeals />}

        {/* CTA Section */}
        <section className="mt-16 rounded-lg bg-slate-900 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{isSeller ? 'Keep your shop moving' : 'Start Shopping Now'}</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            {isSeller
              ? 'Add new arrivals, update your prices and pack the orders waiting on you.'
              : 'Discover thousands of products from top Zambian brands, all in one place.'}
          </p>
          <Link
            to={isSeller ? '/seller/dashboard' : '/products'}
            className={`inline-block rounded-lg px-8 py-3 font-semibold transition ${isSeller ? 'bg-purple-700 hover:bg-purple-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isSeller ? 'Go to dashboard →' : 'Shop Now →'}
          </Link>
        </section>
      </main>
    </>
  );
}
