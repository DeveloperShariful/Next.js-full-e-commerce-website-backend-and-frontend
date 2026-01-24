// File: app/(storefront)/_component/SmarterChoice.tsx
"use client";

import Image from 'next/image';
import { useRef } from 'react';

const choices = [
    { 
      imageSrc: "https://res.cloudinary.com/dbij2wehz/image/upload/Electric-Balance-Bike-Electric-bike-scaled-1.webp", 
      width: 1500, height: 1200,
      label: "Safety Foundation", 
      title: "Safety is Our Foundation", 
      description: "From a gentle, slow-start mode for beginners to responsive, powerful brakes for confident riders, every detail is engineered to keep your child safe." 
    },
    { 
      imageSrc: "https://res.cloudinary.com/dbij2wehz/image/upload/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-Electric-bike-E-bike-review-Electric-bike-review-Buy-e-bike-Buy-electric-bike-E-bike-price-Electric-bike-price-_1.webp", 
      width: 2560, height: 1706,
      label: "Durability", 
      title: "Built for Real Kids", 
      description: "Kids play hard. We get it. That's why GoBikes are built with durable, high-quality frames and components that can handle bumps, skids, and years of relentless fun."
    },
    { 
      imageSrc: "https://res.cloudinary.com/dbij2wehz/image/upload/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-scaled-1.webp", 
      width: 1941, height: 1294,
      label: "Battery Life", 
      title: "More Riding, Less Waiting", 
      description: "Our high-efficiency batteries offer the longest run-times available, so the adventure doesn't have to stop. More time on the bike, less time plugged into the wall."
    },
    { 
      imageSrc: "https://res.cloudinary.com/dbij2wehz/image/upload/Electric-Balance-Bike-Electric-bike-Balance-Bike-scaled-1.webp", 
      width: 1920, height: 1370,
      label: "Aussie Owned", 
      title: "Aussie Owned & Supported", 
      description: "We're not just a store, we're a team of Aussie parents right here to help. When you need support, you'll get real advice from people who actually use and love the product."
    }
];

const SmarterChoice = () => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const scrollAmount = direction === 'left' 
                ? -(current.offsetWidth * 0.9)
                : (current.offsetWidth * 0.9);
            
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

  return (
    <section className="py-12 px-2.5 font-sans w-full">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Why GoBike is The Smarter Choice</h2>
          <p className="text-lg text-black max-w-3xl mx-auto leading-relaxed">When we could not find the best kids electric bike for our own kids, we decided to build it. Every GoBike is a promise of, durability, performance and pure FUN.</p>
        </div>

        <div className="relative px-2.5">
            {/* Grid/Slider */}
            <div 
                ref={sliderRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible snap-x md:snap-none no-scrollbar pb-3"
                style={{ scrollbarWidth: 'none' }}
            >
                {choices.map((choice, index) => (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-lg transition-all duration-300 min-w-[90%] md:min-w-0 snap-start" key={index}>
                        <div className="relative w-full bg-gray-300">
                            <Image
                                src={choice.imageSrc}
                                alt={choice.label}
                                width={choice.width}
                                height={choice.height}
                                sizes="(max-width: 767px) 90vw, (max-width: 992px) 50vw, 25vw"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                        <div className="p-6 flex-grow">
                            <h3 className="text-xl font-bold mb-3">{choice.title}</h3>
                            <p className="text-base text-gray-700 leading-relaxed">{choice.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Buttons (Visible on Mobile Only via logic usually, but here styled like original) */}
            <button onClick={() => scroll('left')} className="absolute top-[35%] -translate-y-1/2 left-0 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10 md:hidden" aria-label="Previous">&#10094;</button>
            <button onClick={() => scroll('right')} className="absolute top-[35%] -translate-y-1/2 right-0 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10 md:hidden" aria-label="Next">&#10095;</button>
        </div>

      </div>
    </section>
  );
}

export default SmarterChoice;