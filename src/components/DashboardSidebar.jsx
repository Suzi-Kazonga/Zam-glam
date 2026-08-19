import { Link } from 'react-router-dom';

export default function DashboardSidebar({ role = 'customer' }) {
  const items = role === 'seller'
    ? ['Overview', 'Products', 'Orders', 'Analytics']
    : ['Overview', 'Orders', 'Cart', 'Profile', 'Wishlist'];

  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2 className="font-bold text-xl mb-4">{role === 'seller' ? 'Seller Panel' : 'Customer Panel'}</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item}
            to="#"
            className="block rounded px-3 py-2 text-gray-700 hover:bg-white hover:shadow-sm"
          >
            {item}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
