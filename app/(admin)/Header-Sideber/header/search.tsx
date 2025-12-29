// File: app/(admin)/admin/Header-Sideber/header/search.tsx

"use client";

import { Search as SearchIcon, Loader2, Package, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getGlobalSearchResults } from "@/app/actions/admin/header-sideber/global-search";

// Debounce helper to prevent too many requests
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Search() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ products: [], orders: [], customers: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300); // 300ms delay

  // Fetch Results when query changes
  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 2) {
        setResults({ products: [], orders: [], customers: [] });
        return;
      }
      
      setLoading(true);
      const data = await getGlobalSearchResults(debouncedQuery);
      setResults(data);
      setLoading(false);
      setShowResults(true);
    }

    fetchResults();
  }, [debouncedQuery]);

  // Keyboard Shortcut (CMD+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.customers.length > 0;

  return (
    <div className="relative w-full max-w-md hidden sm:block group">
      
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <SearchIcon size={16} />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
             setQuery(e.target.value);
             if(e.target.value.length > 0) setShowResults(true);
          }}
          onFocus={() => { if(query.length >= 2) setShowResults(true); }}
          placeholder="Search products, orders, customers..."
          className="w-full h-10 pl-10 pr-12 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder:text-slate-400"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button onClick={clearSearch} className="text-slate-400 hover:text-slate-600">
               <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showResults && (query.length >= 2) && (
        <div ref={dropdownRef} className="absolute top-12 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95">
           
           {!hasResults && !loading && (
              <div className="p-4 text-center text-slate-500 text-sm">
                 No results found for "{query}"
              </div>
           )}

           {/* Products Section */}
           {results.products.length > 0 && (
             <div className="p-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Products</h3>
                {results.products.map((p: any) => (
                   <Link 
                     key={p.id} 
                     href={`/admin/products/create?id=${p.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                   >
                      <div className="w-8 h-8 rounded bg-slate-100 relative overflow-hidden flex-shrink-0 border border-slate-200">
                         {p.featuredImage ? (
                            <Image src={p.featuredImage} alt={p.name} fill className="object-cover" />
                         ) : (
                            <Package size={16} className="m-auto text-slate-400"/>
                         )}
                      </div>
                      <span className="text-sm text-slate-700 font-medium truncate">{p.name}</span>
                   </Link>
                ))}
             </div>
           )}

           {/* Orders Section */}
           {results.orders.length > 0 && (
             <div className="p-2 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 mt-1">Orders</h3>
                {results.orders.map((o: any) => (
                   <Link 
                     key={o.id} 
                     href={`/admin/orders/${o.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                   >
                      <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                         <ShoppingCart size={16} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm text-slate-700 font-bold">#{o.orderNumber}</span>
                         <span className="text-[10px] text-slate-500 uppercase">{o.status} • ৳{o.total}</span>
                      </div>
                   </Link>
                ))}
             </div>
           )}

           {/* Customers Section */}
           {results.customers.length > 0 && (
             <div className="p-2 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 mt-1">Customers</h3>
                {results.customers.map((c: any) => (
                   <Link 
                     key={c.id} 
                     href={`/admin/customers/${c.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                   >
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600 overflow-hidden relative">
                         {c.image ? <Image src={c.image} alt={c.name} fill className="object-cover"/> : <User size={16} />}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                         <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{c.email}</span>
                      </div>
                   </Link>
                ))}
             </div>
           )}

        </div>
      )}
    </div>
  );
}