// app/blog/BlogSlider.tsx

"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostData } from '@/lib/posts';

type BlogSliderProps = {
  posts: PostData[];
};

export default function BlogSlider({ posts }: BlogSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const scrollAmount = scrollerRef.current.firstElementChild!.clientWidth + 30;

      scrollerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/slider">
      <button 
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-[#e7e7e7] shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-pointer items-center justify-center text-[22px] text-[#333] transition-all duration-200 hover:-translate-y-1/2 hover:scale-110 left-[-24px]"
        onClick={() => scroll('left')}
        aria-label="Previous Posts"
      >
        &#10094;
      </button>
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory py-[15px] -mx-[15px] px-[15px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" 
        ref={scrollerRef}
      >
        {posts.map(({ slug, frontmatter }) => (
          <Link 
            key={slug} 
            href={`/blog/${slug}`} 
            className="flex flex-col bg-white border border-[#f0f0f0] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden no-underline text-inherit transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] shrink-0 snap-start mr-[30px] last:mr-0 w-[85%] md:w-[calc(50%-15px)] lg:w-[calc(33.333%-20px)]"
          >
            <div className="relative w-full aspect-[16/10]">
              <Image
                loading="lazy"
                src={frontmatter.cover_image}
                alt={frontmatter.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
              {typeof frontmatter.badge === 'string' && frontmatter.badge && (
                <span className="absolute top-4 left-4 py-[6px] px-[14px] bg-[rgba(20,20,20,0.85)] text-white text-xs font-semibold rounded-[20px] tracking-[0.5px]">
                  {frontmatter.badge}
                </span>
              )}

            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-[20px] leading-[1.4] font-bold text-[#1a1a1a] mb-3">
                {frontmatter.title}
              </h3>
              <p className="text-[15px] leading-[1.6] text-[#555555] mb-6 flex-grow">
                {frontmatter.excerpt}
              </p>
              <span className="font-semibold text-[#333333] transition-colors duration-200 hover:text-[#007bff]">
                Read The Full Story »
              </span>
            </div>
          </Link>
        ))}
      </div>

      <button 
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-[#e7e7e7] shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-pointer items-center justify-center text-[22px] text-[#333] transition-all duration-200 hover:-translate-y-1/2 hover:scale-110 right-[-24px]"
        onClick={() => scroll('right')}
        aria-label="Next Posts"
      >
        &#10095;
      </button>
    </div>
  );
}