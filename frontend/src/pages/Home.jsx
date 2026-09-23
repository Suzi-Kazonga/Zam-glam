import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import StoreCard from '../components/StoreCard';
import FeaturedDeals from '../components/FeaturedDeals';
import { getAllStores, getMyStore } from '../api/storeApi';
import { getSellerProducts } from '../api/productApi';
import { getMyOrders } from '../api/orderApi';
import { withStoreLogos, getStoreLogo } from '../utils/storeLogos';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import { useProductEditor } from '../hooks/useProductEditor';
import { isLocalDemoSession } from '../utils/localSession';
import { formatZmwPrice } from '../utils/currency';

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
// A seller's own catalogue, shown on their home page so they can fix a listing without
// first going to the dashboard. Preview only — the dashboard remains the full manager.
const HOME_PREVIEW_LIMIT = 8;

function SellerProducts({ products, onAdd, onEdit, storefront }) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-700">Your catalogue</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Your products</h2>
          <p className="mt-1 text-slate-500">Only your shop's items appear here.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAdd} className="rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800">Add product</button>
          <Link to="/seller/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-purple-700 hover:text-purple-700">Manage all products →</Link>
        </div>
      </div>

      {products.length ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, HOME_PREVIEW_LIMIT).map((product) => (
            <article key={product.id} className="overflow-hidden rounded-lg bg-white shadow-md">
              <img src={product.image_url || product.images?.[0] || '/images/products/mud-denim.jpg'} alt={product.name} className="h-52 w-full object-cover" />
              <div className="p-4">
                <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-lg font-bold text-purple-800">{formatZmwPrice(product.price)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {Number(product.stock) === 0 ? <span className="text-rose-600">Sold out</span> : `${product.stock} in stock`}
                </p>
                <button type="button" onClick={() => onEdit(product)} className="mt-3 w-full rounded-lg border border-purple-700 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                  Edit details
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">You have not listed anything yet.</p>
          <button type="button" onClick={onAdd} className="mt-4 rounded-lg bg-purple-700 px-5 py-2 font-semibold text-white hover:bg-purple-800">List your first product</button>
        </div>
      )}

      {products.length > HOME_PREVIEW_LIMIT && (
        <p className="mt-4 text-sm text-slate-500">
          Showing {HOME_PREVIEW_LIMIT} of {products.length}. <Link to={storefront} className="font-semibold text-purple-700">See them all on your shop page →</Link>
        </p>
      )}
    </section>
  );
}

function SellerStoreBanner({ shopName, storefront, ordersNeedingAction }) {
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
            {/* Orders waiting on this shop are the most urgent thing on the page. */}
            <Link
              to="/seller/dashboard"
              className={`relative rounded-lg px-5 py-2 font-semibold text-white ${ordersNeedingAction > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-700 hover:bg-purple-800'}`}
            >
              {ordersNeedingAction > 0 ? `Work on ${ordersNeedingAction} order${ordersNeedingAction === 1 ? '' : 's'}` : 'Work on orders'}
              {ordersNeedingAction > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-rose-700">{ordersNeedingAction}</span>
              )}
            </Link>
            <Link to="/seller/dashboard" className="rounded-lg bg-purple-700 px-5 py-2 font-semibold text-white hover:bg-purple-800">Open dashboard</Link>
            <Link to={storefront} className="rounded-lg border border-white/60 px-5 py-2 font-semibold text-white hover:bg-white/10">View my shop</Link>
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
  const [myProducts, setMyProducts] = useState([]);
  const [storefront, setStorefront] = useState('/products');
  const [ordersNeedingAction, setOrdersNeedingAction] = useState(0);

  const loadMyProducts = () => {
    getSellerProducts().then((list) => setMyProducts(Array.isArray(list) ? list : [])).catch(() => setMyProducts([]));
  };

  const editor = useProductEditor({ onSaved: loadMyProducts });

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

  useEffect(() => {
    if (!isSeller || isLocalDemoSession()) return undefined;
    loadMyProducts();
    getMyStore().then((store) => { if (store?.id) setStorefront(`/stores/${store.id}`); }).catch(() => {});

    const checkOrders = () => {
      getMyOrders()
        .then((orders) => setOrdersNeedingAction(orders.filter((order) => ['placed', 'processing'].includes(order.status)).length))
        .catch(() => {});
    };
    checkOrders();
    const poll = window.setInterval(checkOrders, 10000);
    return () => window.clearInterval(poll);
  }, [isSeller, user?.email]);

  return (
    <>
      {isSeller
        ? <SellerStoreBanner shopName={shopName} storefront={storefront} ordersNeedingAction={ordersNeedingAction} />
        : <HeroBanner />}
      {editor.showForm && (
        <ProductForm
          form={editor.form}
          setForm={editor.setForm}
          message={editor.message}
          saving={editor.saving}
          onClose={editor.close}
          onImages={editor.handleImages}
          onSubmit={editor.submit}
        />
      )}
      <main className="mx-auto max-w-7xl px-4 py-12">
        {isSeller && (
          <SellerProducts
            products={myProducts}
            onAdd={editor.openCreate}
            onEdit={editor.openEdit}
            storefront={storefront}
          />
        )}

        {/* Quick Navigation */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/collections"
              className="rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center text-white hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-2">Browse Collections</h3>
              <p className="text-indigo-100">Shop by category and discover fresh looks for every day</p>
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
