"use client";

import { useState } from "react";
// Import Review Components
import ReviewSummary from "./review-summary";
import ReviewList from "./review-list";
import ReviewForm from "./review-form";

interface Props {
  description: string | null;
  productId: string; // Need ID for creating reviews
  reviews: any[];    // Passed from Server
  stats: any;        // Passed from Server
}

export default function ProductDetailsTabs({ description, productId, reviews, stats }: Props) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  return (
    <div className="mt-20 border-t border-slate-100 pt-10">
      {/* Tabs Header */}
      <div className="flex gap-8 mb-6 border-b border-slate-200 pb-4">
        <button 
          onClick={() => setActiveTab("description")}
          className={`text-lg font-medium pb-4 -mb-4.5 border-b-2 transition-colors ${
            activeTab === "description" 
              ? "border-slate-900 text-slate-900 font-bold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Description
        </button>
        <button 
          onClick={() => setActiveTab("reviews")}
          className={`text-lg font-medium pb-4 -mb-4.5 border-b-2 transition-colors ${
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
          <div className="prose max-w-none text-slate-600 leading-relaxed">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p>No description available.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Summary & List */}
            <div className="lg:col-span-2 space-y-8">
               <ReviewSummary stats={stats} />
               <ReviewList reviews={reviews} />
            </div>
            
            {/* Right: Write Review Form */}
            <div>
               <ReviewForm productId={productId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}