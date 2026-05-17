// ফাইল পাথ: app/product/custom-sections/Accordion.tsx

'use client';
import { useState } from 'react';

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200">
          <button
            className="w-full bg-transparent border-none py-6 px-4 flex justify-between items-center cursor-pointer text-left text-lg font-semibold text-gray-800 transition-colors hover:text-black focus:outline-none"
            onClick={() => toggleAccordion(index)}
          >
            <span>{item.question}</span>
            <span 
                className={`text-xs transition-transform duration-300 ease-in-out ${activeIndex === index ? 'rotate-180' : 'rotate-0'}`}
            >
              &#9660;
            </span>
          </button>
          <div 
            className={`overflow-hidden transition-[max-height,padding] duration-500 ease-in-out px-4 ${activeIndex === index ? 'max-h-[500px] pb-6 pt-2' : 'max-h-0 py-0'}`}
          >
            <p className="m-0 text-base text-gray-600 leading-relaxed">
                {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}