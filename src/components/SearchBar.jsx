import { useEffect, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = ({ onSearch, placeholder = 'Search products and orders' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <label className="relative block w-full max-w-xl">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
      <input
        type="text"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </label>
  );
};

export default SearchBar;
