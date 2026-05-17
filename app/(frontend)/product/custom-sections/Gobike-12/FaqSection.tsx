// app/product/custom-sections/Gobike-12/FaqSection.tsx

import Accordion from '../Accordion';
import Link from 'next/link';
import { productFaqMap } from '../../productFaqs';

const CURRENT_PRODUCT_SLUG = 'ebike-for-kids-12-inch-electric-bike-ages-2-5';

export default function FaqSection12() {
  const faqData = productFaqMap[CURRENT_PRODUCT_SLUG] || productFaqMap['default'];

  return (
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border bg-[#f7fafc]">
      <div className="flex justify-center items-center mx-auto mb-10 max-w-[800px]">
        <h2 className="text-[1.5rem] md:text-[2rem] font-bold text-[#1a202c] text-center">
          Frequently Asked Questions
        </h2>
      </div>
      <Accordion items={faqData} />
      
      <div className="mt-10 flex justify-center w-full">
        <Link 
          href="/faq" 
          className="inline-block py-3 px-7 bg-black text-white text-center font-semibold rounded-lg transition-all duration-300 ease-in-out border border-transparent hover:bg-[#333] hover:-translate-y-0.5"
        >
          See More FAQs
        </Link>
      </div>
    </section>
  );
}