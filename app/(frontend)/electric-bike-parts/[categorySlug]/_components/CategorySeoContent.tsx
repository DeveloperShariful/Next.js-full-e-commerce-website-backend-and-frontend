// app/(frontend)/electric-bike-parts/[categorySlug]/_components/CategorySeoContent.tsx

export default function CategorySeoContent({ seoData }: { seoData: any }) {
    if (!seoData) return null;
  
    return (
      <div className="bg-white border-t border-gray-200 py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-6">
          
          {/* H2 Text Sections */}
          <div className="space-y-12">
            {seoData.bottomSections.map((sec: any, index: number) => (
              <div key={index} className="prose prose-lg max-w-none">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-5">{sec.h2}</h2>
                <p className="text-gray-600 leading-relaxed text-lg">{sec.p}</p>
              </div>
            ))}
          </div>
  
          {/* FAQ Section (Modern UI) */}
          {seoData.faqs && seoData.faqs.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
                <p className="text-gray-500 mt-2">Everything you need to know about our products.</p>
              </div>
              
              <div className="space-y-4">
                {seoData.faqs.map((faq: any, index: number) => (
                  <details 
                    key={index} 
                    className="group bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 md:p-6 text-gray-900 font-bold text-lg hover:bg-gray-50 transition-colors">
                      {faq.q}
                      <span className="relative flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 group-open:bg-gray-900 group-open:text-white transition-all duration-300">
                         {/* Plus Icon (Shows when closed) */}
                        <svg className="absolute w-4 h-4 transition-opacity duration-300 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {/* Minus Icon (Shows when open) */}
                        <svg className="absolute w-4 h-4 transition-opacity duration-300 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 md:px-6 pb-6 text-gray-600 text-base md:text-lg leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
  
        </div>
      </div>
    );
}