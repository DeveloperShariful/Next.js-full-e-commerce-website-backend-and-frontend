////app/kids-ebike-hub/category/_components/CategoryFilter.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const ALL_CATEGORIES = [
  "News",
  "Customer Videos",
  "Team Riders",
  "Events",
  "Track Days",
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '');
}

export default function CategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();

  // বর্তমান URL থেকে অ্যাকটিভ ক্যাটাগরি বের করা
  const currentCategorySlug = pathname.split('/').pop();
  const isAllPosts = pathname === '/kids-ebike-hub';

  return (
    <div className="mb-12">
      {/* =========================================
          MOBILE VIEW: Premium Dropdown
      ========================================= */}
      <div className="block md:hidden max-w-sm mx-auto relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
        </div>
        <select
          value={isAllPosts ? "all" : currentCategorySlug}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "all") router.push('/kids-ebike-hub');
            else router.push(`/kids-ebike-hub/category/${val}`);
          }}
          className="w-full bg-white border-2 border-gray-200 text-gray-900 text-base font-bold rounded-xl focus:ring-black focus:border-black block pl-12 pr-8 py-3.5 appearance-none shadow-sm cursor-pointer"
        >
          <option value="all">⚡ All Posts</option>
          {ALL_CATEGORIES.map(cat => (
            <option key={cat} value={slugify(cat)}>{cat}</option>
          ))}
        </select>
        {/* Dropdown Arrow Icon */}
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW: Sleek Pill Buttons
      ========================================= */}
      <div className="hidden md:flex flex-wrap justify-center gap-3">
        <Link 
          href="/kids-ebike-hub" 
          className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${isAllPosts ? 'bg-black text-white scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}
        >
          All Posts
        </Link>
        {ALL_CATEGORIES.map((category) => {
          const slug = slugify(category);
          const isActive = currentCategorySlug === slug;
          return (
            <Link 
              key={category} 
              href={`/kids-ebike-hub/category/${slug}`}
              className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${isActive ? 'bg-black text-white scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}
            >
              {category}
            </Link>
          );
        })}
      </div>
    </div>
  );
}