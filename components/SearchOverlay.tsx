// components/SearchOverlay.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoClose } from 'react-icons/io5';
import Image from 'next/image';
import { searchProductsAction } from '@/app/actions/frontend/home/searchProductsAction';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  image?: {
    sourceUrl: string;
  };
}

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        // GraphQL এর বদলে সরাসরি আমাদের Server Action কল করা হলো
        const data = await searchProductsAction(searchTerm);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div 
        className="fixed inset-0 w-full h-full bg-white/95 z-[10000] flex justify-center pt-[5vh] backdrop-blur-[5px]" 
        onClick={onClose}
    > 
      <button 
        className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#555] p-2 hover:text-black transition-colors" 
        onClick={onClose}
      >
        <IoClose size={40} />
      </button>

      <div 
        className="w-full max-w-[600px] relative h-fit px-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          className="w-full p-4 text-[1.8rem] border-none border-b-2 border-[#ccc] bg-transparent outline-none focus:border-[#333]"
          placeholder="Search for products..."
          autoFocus
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="mt-8 max-h-[70vh] overflow-y-auto">
          {loading && <p className="text-gray-500">Searching...</p>}
          {!loading && results.length > 0 && (
            <ul className="list-none p-0 m-0">
              {results.map(product => (
                <li key={product.id}>
                  <Link 
                    href={`/product/${product.slug}`} 
                    onClick={onClose}
                    className="flex items-center p-4 no-underline text-[#333] rounded-lg transition-colors duration-200 ease-in-out hover:bg-[#f0f0f0]"
                  >
                    <Image 
                        src={product.image?.sourceUrl || '/placeholder.png'} 
                        alt={product.name} 
                        width={50} 
                        height={50}  
                        className="w-[50px] h-[50px] object-cover mr-4 rounded"
                    />
                    <span className="font-medium text-lg">{product.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loading && results.length === 0 && searchTerm.length >= 3 && (
            <p className="text-gray-500 text-lg">No products found for “{searchTerm}”</p>
          )}
        </div>
      </div>
    </div>
  );
}