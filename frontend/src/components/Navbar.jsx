import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-black">Zamglam</Link>
        <div className="hidden md:flex gap-4 text-sm text-gray-700">
          {/* No Home item: the Zamglam wordmark links home. */}
          <Link to="/products">Products</Link>
          <Link to="/customer/dashboard">Dashboard</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/signup" className="border px-3 py-2 rounded">Signup</Link>
        <Link to="/login" className="bg-black text-white px-3 py-2 rounded">Login</Link>
      </div>
    </nav>
  );
}
