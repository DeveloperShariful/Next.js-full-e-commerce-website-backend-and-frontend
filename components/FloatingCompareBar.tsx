// components/FloatingCompareBar.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation'; // <-- Import usePathname
import { useCompare } from '@/context/CompareContext';

export default function FloatingCompareBar() {
  const { compareItems, clearCompare } = useCompare();
  const pathname = usePathname();

  // যদি Compare লিস্ট খালি থাকে অথবা ইউজার /compare পেজে থাকে, তাহলে এই বার দেখাবে না
  if (compareItems.length === 0 || pathname === '/compare') return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-50 p-4 transform transition-transform duration-300 ease-in-out">
      <div className="max-w-[1300px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900 text-lg">
            Compare Products ({compareItems.length}/4)
          </span>
          
          <div className="hidden md:flex gap-2">
            {compareItems.map((item) => (
              <div key={item.id} className="w-12 h-12 relative bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                ) : (
                  <span className="text-[10px] flex items-center justify-center h-full text-gray-400">No Img</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={clearCompare} 
            className="text-gray-500 hover:text-red-600 font-semibold text-sm transition-colors"
          >
            Clear All
          </button>
          
          <Link 
            href="/compare" 
            className="flex-1 sm:flex-none text-center bg-blue-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            Compare Now
          </Link>
        </div>

      </div>
    </div>
  );
}