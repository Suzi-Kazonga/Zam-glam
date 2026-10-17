// The row of category links across the top of the catalogue.

import { Link } from 'react-router-dom';

export default function CategoryNav() {
  const links = [
    ['Men', '/products?audience=men'],
    ['Women', '/products?audience=women'],
    ['Shoes', '/products?category=shoes'],
    ['Pants', '/products?category=pants'],
    ['Shirts', '/products?category=shirts'],
    ['Dresses', '/products?category=dresses'],
  ];

  return (
    <nav aria-label="Shop by category" className="overflow-x-auto border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl min-w-max justify-center gap-8 px-4 py-4 text-sm font-semibold text-slate-600">
        {links.map(([label, href]) => (
          <Link key={label} to={href} className="hover:text-indigo-600">{label}</Link>
        ))}
      </div>
    </nav>
  );
}