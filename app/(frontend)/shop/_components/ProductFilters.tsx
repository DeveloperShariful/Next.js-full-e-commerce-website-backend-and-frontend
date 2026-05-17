// app/(frontend)/shop/_components/ProductFilters.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IoChevronDown, IoOptionsOutline } from 'react-icons/io5';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeCategorySlug = searchParams.get('category') || 'all';
  const activeCategory = categories.find(c => c.slug === activeCategorySlug) || { name: 'All Products' };

  // ড্রপডাউনের বাইরে ক্লিক করলে মেনু বন্ধ হওয়ার লজিক
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // এসইও (SEO) ফ্রেন্ডলি URL জেনারেট করার লজিক
  const createCategoryUrl = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // ক্যাটাগরি চেঞ্জ করলে পেজ নম্বর রিসেট হবে
    params.delete('page');

    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    
    const queryString = params.toString();
    return queryString ? `/shop?${queryString}` : '/shop';
  };

  return (
    // প্রফেশনাল ই-কমার্স টুলবার লেআউট (বটম বর্ডারসহ)
    <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-5 mb-8 w-full relative z-40">
        
        {/* Left Side: Filter Icon & Text */}
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg mb-4 sm:mb-0">
            <IoOptionsOutline className="text-2xl text-black" />
            <span>Filter Catalog</span>
        </div>

        {/* Right Side: Professional Dropdown Menu */}
        <div className="relative w-full sm:w-[260px]" ref={wrapperRef}>
            <button 
                className="w-full flex justify-between items-center px-4 py-3 bg-white border border-gray-300 hover:border-black rounded-md text-sm font-medium text-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-black"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate pr-2">{activeCategory.name}</span>
                <IoChevronDown 
                    className="flex-shrink-0 text-gray-500"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} 
                />
            </button>
            
            {/* Dropdown List */}
            {isOpen && (
                <ul className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-200 rounded-md shadow-2xl list-none py-1 m-0 z-[100] max-h-[350px] overflow-y-auto">
                    
                    <li>
                        <Link 
                            href={createCategoryUrl('all')}
                            onClick={() => setIsOpen(false)}
                            className={`block px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
                                activeCategorySlug === 'all' ? 'font-bold text-black bg-gray-50' : 'text-gray-600'
                            }`}
                        >
                            All Products
                        </Link>
                    </li>

                    {categories.map((category) => (
                        <li key={category.id}>
                            <Link 
                                href={createCategoryUrl(category.slug)}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
                                    activeCategorySlug === category.slug ? 'font-bold text-black bg-gray-50' : 'text-gray-600'
                                }`}
                            >
                                {category.name}
                            </Link>
                        </li>
                    ))}

                </ul>
            )}
        </div>
    </div>
  );
}