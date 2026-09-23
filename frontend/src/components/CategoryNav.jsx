// The row of category links across the top of the catalogue.

import { Link } from 'react-router-dom';

export default function CategoryNav() {
  return <nav className="overflow-x-auto border-b border-slate-100 bg-white"><div className="mx-auto flex max-w-7xl min-w-max justify-center gap-8 px-4 py-4 text-sm font-semibold text-slate-600"><Link to="/products?category=pants" className="hover:text-indigo-600">Pants</Link><Link to="/products?category=shirts" className="hover:text-indigo-600">Shirts</Link><Link to="/products?category=shoes" className="hover:text-indigo-600">Shoes</Link></div></nav>;
}