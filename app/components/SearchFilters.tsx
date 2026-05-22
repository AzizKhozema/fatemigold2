'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // Run: npm install use-debounce
import { Search, X, Filter } from 'lucide-react';

// Define the shape of the filters you want to pass in
interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;       // URL param name (e.g. 'status', 'type')
  label: string;     // Display text (e.g. 'Status', 'Material Type')
  options: FilterOption[];
}

interface SearchFilterProps {
  placeholder?: string;
  filters?: FilterConfig[]; // Optional array of dropdowns
}

export default function SearchFilter({ 
  placeholder = 'Search...', 
  filters = [] 
}: SearchFilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 1. Handle Text Search (Debounced to prevent lag)
  // This waits 300ms after you stop typing before updating the URL
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    // Reset page to 1 when searching/filtering
    params.set('page', '1');

    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // 2. Handle Dropdown Filters
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset pagination

    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    replace(`${pathname}?${params.toString()}`);
  };

  // 3. Clear All Filters
  const clearFilters = () => {
    replace(pathname); // Removes all params
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
      
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={searchParams.get('query')?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
        />
      </div>

      {/* Dynamic Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map((filter) => (
          <div key={filter.key} className="relative">
             <select
               defaultValue={searchParams.get(filter.key) || ''}
               onChange={(e) => handleFilterChange(filter.key, e.target.value)}
               className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer min-w-[140px]"
             >
               <option value="all">{filter.label} (All)</option>
               {filter.options.map((opt) => (
                 <option key={opt.value} value={opt.value}>
                   {opt.label}
                 </option>
               ))}
             </select>
             {/* Tiny arrow icon for select */}
             <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
          </div>
        ))}

        {/* Clear Button (Only shows if filters are active) */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 px-3 py-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}