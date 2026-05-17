// ফাইল পাথ: app/product//custom-sections/FeatureSlider.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWindowSize } from '../useWindowSize';

interface Feature {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}

interface FeatureSliderProps {
  title: string;
  features: Feature[];
}

export default function FeatureSlider({ title, features }: FeatureSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowSize();
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    if (width < 768) {
      setItemsPerPage(1); 
    } else if (width < 1024) {
      setItemsPerPage(2); 
    } else {
      setItemsPerPage(3); 
    }
  }, [width]);
  // =======================================================================

  const canSlide = features.length > itemsPerPage;

  const goToPrevious = () => {
    if (!canSlide) return;
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? features.length - itemsPerPage : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    if (!canSlide) return;
    const isLastSlide = currentIndex >= features.length - itemsPerPage;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10 px-2">
        <h2 className="text-2xl md:text-[2rem] font-bold text-slate-900">{title}</h2>
        {canSlide && (
          <div className="flex gap-2">
            <button 
                onClick={goToPrevious} 
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-lg text-slate-600 cursor-pointer transition-all duration-200 ease-in-out hover:bg-slate-200 hover:text-slate-900"
            >
                &#10094;
            </button>
            <button 
                onClick={goToNext} 
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-lg text-slate-600 cursor-pointer transition-all duration-200 ease-in-out hover:bg-slate-200 hover:text-slate-900"
            >
                &#10095;
            </button>
          </div>
        )}
      </div>
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            width: `${(100 / itemsPerPage) * features.length}%`,
            transform: `translateX(-${(100 / features.length) * currentIndex}%)` 
          }}
        >
          {features.map((feature, index) => (
            <div key={index} className="box-border px-2">
              <div className="rounded-xl overflow-hidden bg-white border border-slate-200 h-full">
                <div className="relative w-full pt-[60%] bg-slate-50">
                  <Image src={feature.imageSrc} alt={feature.imageAlt} fill style={{ objectFit: 'cover' }} sizes="33vw"/>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-slate-800">{feature.title}</h3>
                  <p className="text-[0.95rem] text-slate-500 leading-relaxed m-0">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {canSlide && (
        <div className="w-[calc(100%-1rem)] h-1 bg-slate-200 rounded-sm mx-auto mt-8">
            <div 
                className="h-full bg-sky-500 rounded-sm transition-[width] duration-300 ease-in-out"
                style={{ width: `${(100 / (features.length - itemsPerPage + 1)) * (currentIndex + 1)}%` }}
            ></div>
        </div>
      )}
    </div>
  );
}