// File: app/(storefront)/product/[slug]/_components/product-details-tab.tsx

"use client";

import { useState } from "react";
// Import Review Components
import ReviewSummary from "./review-summary";
import ReviewList from "./review-list";
import ReviewForm from "./review-form";

interface Props {
  description: string | null;
  productId: string;
  reviews: any[];
  stats: any;
}

export default function ProductDetailsTabs({
  description,
  productId,
  reviews,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  return (
    // overflow-hidden যোগ করা হয়েছে যাতে কোনো চাইল্ড এলিমেন্ট বাইরে না যায়
    <div className="mt-12 lg:mt-20 border-t border-slate-100 pt-8 lg:pt-10 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex gap-6 lg:gap-8 mb-6 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("description")}
          className={`text-base lg:text-lg font-medium pb-3 lg:pb-4 -mb-[1px] lg:-mb-[2px] border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "description"
              ? "border-slate-900 text-slate-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`text-base lg:text-lg font-medium pb-3 lg:pb-4 -mb-[1px] lg:-mb-[2px] border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "reviews"
              ? "border-slate-900 text-slate-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Reviews ({stats.totalReviews})
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === "description" && (
          <div className="
            prose prose-sm sm:prose-base lg:prose-lg
            max-w-full /* max-w-none এর পরিবর্তে max-w-full */
            break-words /* লম্বা শব্দ বা টেক্সট ভেঙে নিচে নামাবে */
            text-slate-600 leading-relaxed
            prose-headings:font-bold prose-headings:text-slate-900
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:w-full prose-img:h-auto prose-img:shadow-sm
            prose-video:w-full prose-video:rounded-xl
            [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl
            [&_table]:block [&_table]:overflow-x-auto [&_table]:whitespace-nowrap
            [&>*:first-child]:mt-0
          ">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p className="text-slate-400 italic">No description available.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Left: Summary & List */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8 order-2 lg:order-1">
              <ReviewSummary stats={stats} />
              <ReviewList reviews={reviews} />
            </div>

            {/* Right: Write Review Form */}
            <div className="order-1 lg:order-2">
               <div className="sticky top-24">
                  <ReviewForm productId={productId} />
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}