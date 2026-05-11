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
      
      {/* 🚀 WP Style Search Input in Admin Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-2 text-[#a7aaad]">
          {loading ? <Loader2 size={14} className="animate-spin text-[#72aee6]" /> : <SearchIcon size={14} />}
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
          placeholder="Search..."
          className="w-[180px] focus:w-[280px] h-[28px] pl-7 pr-8 rounded-[3px] border border-[#50575e] bg-[#1d2327] text-[13px] text-white outline-none focus:bg-white focus:text-[#3c434a] focus:border-[#2271b1] transition-all duration-200 placeholder:text-[#a7aaad] focus:placeholder:text-[#8c8f94]"
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button onClick={clearSearch} className="text-[#a7aaad] hover:text-[#d63638]">
               <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium text-[#a7aaad]">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* 🚀 WP Style Dropdown Results */}
      {showResults && (query.length >= 2) && (
        <div ref={dropdownRef} className="absolute top-[36px] left-0 w-full bg-white shadow-md border border-[#c3c4c7] z-50 max-h-[400px] overflow-y-auto">
           
           {!hasResults && !loading && (
              <div className="p-3 text-center text-[#8c8f94] text-[13px] italic">
                 No results found for "{query}"
              </div>
           )}

           {/* Products Section */}
           {results.products.length > 0 && (
             <div className="p-1">
                <h3 className="text-[11px] font-semibold text-[#8c8f94] uppercase tracking-wider px-2 py-1 bg-[#f0f0f1] border-b border-[#e2e4e7]">Products</h3>
                {results.products.map((p: any) => (
                   <Link 
                     key={p.id} 
                     href={`/admin/products/create?id=${p.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#f0f0f1] transition cursor-pointer border-b border-[#f0f0f1] last:border-0"
                   >
                      <div className="w-6 h-6 bg-[#f0f0f1] relative flex-shrink-0 border border-[#c3c4c7]">
                         {p.featuredImage ? (
                            <Image src={p.featuredImage} alt={p.name} fill className="object-cover" />
                         ) : (
                            <Package size={14} className="m-auto text-[#8c8f94] mt-1"/>
                         )}
                      </div>
                      <span className="text-[13px] text-[#2271b1] hover:text-[#0a4b78] truncate">{p.name}</span>
                   </Link>
                ))}
             </div>
           )}

           {/* Orders Section */}
           {results.orders.length > 0 && (
             <div className="p-1 border-t border-[#c3c4c7]">
                <h3 className="text-[11px] font-semibold text-[#8c8f94] uppercase tracking-wider px-2 py-1 bg-[#f0f0f1] border-b border-[#e2e4e7]">Orders</h3>
                {results.orders.map((o: any) => (
                   <Link 
                     key={o.id} 
                     href={`/admin/orders/${o.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#f0f0f1] transition cursor-pointer border-b border-[#f0f0f1] last:border-0"
                   >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[#8c8f94]">
                         <ShoppingCart size={14} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[13px] text-[#2271b1] hover:text-[#0a4b78]">#{o.orderNumber}</span>
                         <span className="text-[11px] text-[#8c8f94]">{o.status} &ndash; ৳{o.total}</span>
                      </div>
                   </Link>
                ))}
             </div>
           )}

           {/* Customers Section */}
           {results.customers.length > 0 && (
             <div className="p-1 border-t border-[#c3c4c7]">
                <h3 className="text-[11px] font-semibold text-[#8c8f94] uppercase tracking-wider px-2 py-1 bg-[#f0f0f1] border-b border-[#e2e4e7]">Customers</h3>
                {results.customers.map((c: any) => (
                   <Link 
                     key={c.id} 
                     href={`/admin/customers/${c.id}`} 
                     onClick={clearSearch}
                     className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#f0f0f1] transition cursor-pointer border-b border-[#f0f0f1] last:border-0"
                   >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[#8c8f94] overflow-hidden relative">
                         {c.image ? <Image src={c.image} alt={c.name} fill className="object-cover rounded-full"/> : <User size={14} />}
                      </div>
                      <div className="flex flex-col w-full overflow-hidden">
                         <span className="text-[13px] text-[#2271b1] hover:text-[#0a4b78]">{c.name}</span>
                         <span className="text-[11px] text-[#8c8f94] truncate">{c.email}</span>
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