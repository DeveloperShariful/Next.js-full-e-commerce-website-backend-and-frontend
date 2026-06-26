// File: app/(backend)/Header-Sideber/header/search.tsx

"use client";

import {
  Search as SearchIcon, Loader2, Package, ShoppingCart, User,
  X, TicketPercent, LayoutGrid, Award, Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getGlobalSearchResults,
  GlobalSearchResults,
  SearchProduct, SearchOrder, SearchCustomer,
  SearchCoupon, SearchCategory, SearchBrand, SearchTag,
} from "@/app/actions/backend/header-sideber/global-search";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const empty: GlobalSearchResults = {
  products: [], orders: [], customers: [],
  coupons: [], categories: [], brands: [], tags: [],
};

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-bold text-[#8c8f94] uppercase tracking-widest px-3 py-1.5 bg-[#f6f7f7] border-b border-[#e2e4e7]">
      {label}
    </h3>
  );
}

export function Search() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(empty);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 2) { setResults(empty); return; }
      setLoading(true);
      const data = await getGlobalSearchResults(debouncedQuery);
      setResults(data);
      setLoading(false);
      setShowResults(true);
    }
    fetchResults();
  }, [debouncedQuery]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) setShowResults(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => { setQuery(""); setShowResults(false); };

  const hasResults =
    results.products.length > 0 || results.orders.length > 0 ||
    results.customers.length > 0 || results.coupons.length > 0 ||
    results.categories.length > 0 || results.brands.length > 0 ||
    results.tags.length > 0;

  const rowClass = "flex items-center gap-3 px-3 py-2 hover:bg-[#f0f6fc] transition cursor-pointer border-b border-[#f0f0f1] last:border-0";

  return (
    <div className="relative w-full max-w-md hidden sm:block">

      {/* Input */}
      <div className="relative flex items-center">
        <div className="absolute left-2 text-[#a7aaad]">
          {loading
            ? <Loader2 size={14} className="animate-spin text-[#72aee6]" />
            : <SearchIcon size={14} />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.length > 0) setShowResults(true); }}
          onFocus={() => { if (query.length >= 2) setShowResults(true); }}
          placeholder="Search everything..."
          className="w-[180px] focus:w-[300px] h-[28px] pl-7 pr-8 rounded-[3px] border border-[#50575e] bg-[#1d2327] text-[13px] text-white outline-none focus:bg-white focus:text-[#3c434a] focus:border-[#2271b1] transition-all duration-200 placeholder:text-[#a7aaad] focus:placeholder:text-[#8c8f94]"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button onClick={clearSearch} className="text-[#a7aaad] hover:text-[#d63638]">
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex font-mono text-[10px] text-[#a7aaad]">⌘K</kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showResults && query.length >= 2 && (
        <div ref={dropdownRef} className="absolute top-[36px] left-0 w-[360px] bg-white shadow-lg border border-[#c3c4c7] z-50 max-h-[480px] overflow-y-auto scrollbar-none rounded-b-[3px]">

          {!hasResults && !loading && (
            <div className="py-8 text-center text-[#8c8f94] text-[13px] italic">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <SectionHeader label="Products" />
              {results.products.map((p: SearchProduct) => (
                <Link key={p.id} href={`/admin/products/create?id=${p.id}`} onClick={clearSearch} className={rowClass}>
                  <div className="w-7 h-7 bg-[#f0f0f1] border border-[#c3c4c7] shrink-0 relative overflow-hidden rounded-[2px]">
                    {p.featuredImage
                      ? <Image src={p.featuredImage} alt={p.name} fill className="object-cover" />
                      : <Package size={13} className="absolute inset-0 m-auto text-[#8c8f94]" />}
                  </div>
                  <span className="text-[13px] text-[#2271b1] truncate">{p.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <SectionHeader label="Orders" />
              {results.orders.map((o: SearchOrder) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} onClick={clearSearch} className={rowClass}>
                  <ShoppingCart size={14} className="text-[#8c8f94] shrink-0" />
                  <div>
                    <span className="text-[13px] text-[#2271b1]">#{o.orderNumber}</span>
                    <span className="text-[11px] text-[#646970] ml-2">{o.status} · ${o.total.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <SectionHeader label="Customers" />
              {results.customers.map((c: SearchCustomer) => (
                <Link key={c.id} href={`/admin/users`} onClick={clearSearch} className={rowClass}>
                  <div className="w-7 h-7 rounded-full bg-[#f0f0f1] border border-[#c3c4c7] shrink-0 overflow-hidden relative">
                    {c.image
                      ? <Image src={c.image} alt={c.name ?? ""} fill className="object-cover" />
                      : <User size={13} className="absolute inset-0 m-auto text-[#8c8f94]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#2271b1] truncate">{c.name}</p>
                    <p className="text-[11px] text-[#646970] truncate">{c.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Coupons */}
          {results.coupons.length > 0 && (
            <div>
              <SectionHeader label="Coupons" />
              {results.coupons.map((c: SearchCoupon) => (
                <Link key={c.id} href={`/admin/coupons/${c.id}`} onClick={clearSearch} className={rowClass}>
                  <TicketPercent size={14} className="text-[#8c8f94] shrink-0" />
                  <div>
                    <span className="text-[13px] text-[#2271b1] font-mono">{c.code}</span>
                    <span className="text-[11px] text-[#646970] ml-2">{c.type} · {c.value}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Categories */}
          {results.categories.length > 0 && (
            <div>
              <SectionHeader label="Categories" />
              {results.categories.map((c: SearchCategory) => (
                <Link key={c.id} href={`/admin/categories`} onClick={clearSearch} className={rowClass}>
                  <LayoutGrid size={14} className="text-[#8c8f94] shrink-0" />
                  <span className="text-[13px] text-[#2271b1] truncate">{c.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Brands */}
          {results.brands.length > 0 && (
            <div>
              <SectionHeader label="Brands" />
              {results.brands.map((b: SearchBrand) => (
                <Link key={b.id} href={`/admin/brands`} onClick={clearSearch} className={rowClass}>
                  <Award size={14} className="text-[#8c8f94] shrink-0" />
                  <span className="text-[13px] text-[#2271b1] truncate">{b.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Tags */}
          {results.tags.length > 0 && (
            <div>
              <SectionHeader label="Tags" />
              {results.tags.map((t: SearchTag) => (
                <Link key={t.id} href={`/admin/tags`} onClick={clearSearch} className={rowClass}>
                  <Tag size={14} className="text-[#8c8f94] shrink-0" />
                  <span className="text-[13px] text-[#2271b1] truncate">{t.name}</span>
                </Link>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
