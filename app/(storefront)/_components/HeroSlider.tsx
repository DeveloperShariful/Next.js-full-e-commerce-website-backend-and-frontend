// File: app/(storefront)/_component/HeroSlider.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const HeroSlider = () => {
  const totalSlides = 4;
  const [currentSlide, setCurrentSlide] = useState(1);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev % totalSlides) + 1);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <section className="bg-black text-white relative w-full overflow-hidden">
      <div className="w-full relative">
        {/* Slider Wrapper */}
        <div 
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${(currentSlide - 1) * 100}%)` }}
        >
          {/* SLIDE 1: GOBIKE 24 */}
          <div className="min-w-full flex flex-col lg:flex-row min-h-[550px] lg:h-[70vh]">
            <div className="w-full lg:w-[55%] flex items-center justify-center order-1 lg:order-2">
              <Image 
                src="https://gobikes.au/wp-content/uploads/2025/12/Slider-1-scaled.webp" 
                alt="GoBike 24 Inch Electric Dirt Bike" 
                width={1000} height={774} 
                priority 
                className="w-full h-auto max-h-[400px] lg:max-h-full object-contain"
              />
            </div>
            <div className="w-full lg:w-[45%] p-10 flex flex-col justify-center text-center lg:text-left items-center lg:items-start order-2 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] mb-2 text-gray-300">The Extreme Machine</p>
              <h2 className="text-5xl font-extrabold mb-5 leading-tight">GOBIKE 24</h2>
              <p className="text-lg leading-relaxed mb-6 max-w-lg lg:ml-0 text-gray-100">
                The ultimate electric dirt bike for teens and adults aged 12+. Unleash raw power with a massive 2500W motor hitting top speeds of 61km/h.
              </p>
              <Link href="product/gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13" className="bg-white text-black px-9 py-3.5 rounded-full font-bold text-base hover:bg-gray-200 transition-transform hover:scale-105">Shop Now</Link>
            </div>
          </div>

          {/* SLIDE 2: GOBIKE 20 */}
          <div className="min-w-full flex flex-col lg:flex-row min-h-[550px] lg:h-[70vh]">
            <div className="w-full lg:w-[55%] flex items-center justify-center order-1 lg:order-2">
              <Image 
                src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike20-inch-ages-for10-16-1-1.webp" 
                alt="GoBike 20 Electric Bike" 
                width={1000} height={774} 
                priority 
                className="w-full h-auto max-h-[400px] lg:max-h-full object-contain"
              />
            </div>
            <div className="w-full lg:w-[45%] p-10 flex flex-col justify-center text-center lg:text-left items-center lg:items-start order-2 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] mb-2 text-gray-300">The Ultimate Weapon</p>
              <h2 className="text-5xl font-extrabold mb-5 leading-tight">GOBIKE 20</h2>
              <p className="text-lg leading-relaxed mb-6 max-w-lg lg:ml-0 text-gray-100">
                The best 20-inch kids electric bike on the market. Built tough for young adventurers and teens, it delivers powerful performance.
              </p>
              <Link href="product/20-inch-electric-bikes-for-sale-ebike-for-kids" className="bg-white text-black px-9 py-3.5 rounded-full font-bold text-base hover:bg-gray-200 transition-transform hover:scale-105">Shop Now</Link>
            </div>
          </div>

          {/* SLIDE 3: GOBIKE 16 */}
          <div className="min-w-full flex flex-col lg:flex-row min-h-[550px] lg:h-[70vh]">
            <div className="w-full lg:w-[55%] flex items-center justify-center order-1 lg:order-2">
              <Image 
                src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike20-inch-ages-for10-16-2.webp" 
                alt="GoBike 16 Electric Bike" 
                width={1000} height={849} 
                className="w-full h-auto max-h-[400px] lg:max-h-full object-contain"
              />
            </div>
            <div className="w-full lg:w-[45%] p-10 flex flex-col justify-center text-center lg:text-left items-center lg:items-start order-2 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] mb-2 text-gray-300">The All-Rounder</p>
              <h2 className="text-5xl font-extrabold mb-5 leading-tight">GOBIKE 16</h2>
              <p className="text-lg leading-relaxed mb-6 max-w-lg lg:ml-0 text-gray-100">
                The fastest 16-inch kids electric bike on the market! Designed for confident young riders with 3 speed modes.
              </p>
              <Link href="product/ebike-for-sale-16-inch-gobike-ages-5-9" className="bg-white text-black px-9 py-3.5 rounded-full font-bold text-base hover:bg-gray-200 transition-transform hover:scale-105">Shop Now</Link>
            </div>
          </div>

          {/* SLIDE 4: GOBIKE 12 */}
          <div className="min-w-full flex flex-col lg:flex-row min-h-[550px] lg:h-[70vh]">
            <div className="w-full lg:w-[55%] flex items-center justify-center order-1 lg:order-2">
              <Image 
                src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-electric-bike-kids-ebike12-inch-ages-for-2-5-1.webp" 
                alt="GoBike 12 Electric Bike" 
                width={1000} height={803} 
                className="w-full h-auto max-h-[400px] lg:max-h-full object-contain"
              />
            </div>
            <div className="w-full lg:w-[45%] p-10 flex flex-col justify-center text-center lg:text-left items-center lg:items-start order-2 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] mb-2 text-gray-300">The Everyday GoBike Range</p>
              <h2 className="text-5xl font-extrabold mb-5 leading-tight">GOBIKE 12</h2>
              <p className="text-lg leading-relaxed mb-6 max-w-lg lg:ml-0 text-gray-100">
                The perfect first electric bike for toddlers aged 2 years and above transitioning from a balance bike.
              </p>
              <Link href="product/ebike-for-kids-12-inch-electric-bike-ages-2-5" className="bg-white text-black px-9 py-3.5 rounded-full font-bold text-base hover:bg-gray-200 transition-transform hover:scale-105">Shop Now</Link>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 lg:left-[22.5%] -translate-x-1/2 flex gap-3 z-10">
          {[1, 2, 3, 4].map((idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full border border-gray-400 transition-colors ${currentSlide === idx ? 'bg-white' : 'bg-transparent'}`}
              aria-label={`Go to slide ${idx}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;