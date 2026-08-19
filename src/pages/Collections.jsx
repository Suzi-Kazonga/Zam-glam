import { useState } from 'react';
import { Link } from 'react-router-dom';
import StoreCard from '../components/StoreCard';

const categories = [
  { id: 1, name: 'Men\'s Fashion', icon: '👔' },
  { id: 2, name: 'Women\'s Fashion', icon: '👗' },
  { id: 3, name: 'Shoes & Sneakers', icon: '👟' },
  { id: 4, name: 'Accessories', icon: '⌚' },
  { id: 5, name: 'Home & Living', icon: '🏠' },
  { id: 6, name: 'Sports & Outdoors', icon: '⛹️' },
];

const fallbackStores = [
  { id: 1, name: 'Mud', logo_url: '/images/logos/mud.png' },
  { id: 2, name: 'Jets', logo_url: '/images/logos/jets.png' },
  { id: 3, name: 'Bata', logo_url: '/images/logos/bata.png' },
  { id: 4, name: 'Pep', logo_url: '/images/logos/pep.png' },
  { id: 5, name: 'Mr Price Zambia', logo_url: '/images/logos/mrprice.png' },
  { id: 6, name: 'Fashions Galore', logo_url: '/images/logos/fashionsgalore.png' },
];

export default function Collections() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Categories Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Shop by Category</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-lg transition ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-900 hover:shadow-md hover:border-indigo-300'
                } border border-slate-200`}
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="text-sm font-semibold text-center">{cat.name}</span>
              </button>
            ))}
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
