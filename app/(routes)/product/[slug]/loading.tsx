import React from 'react';

export default function Loading() {
  return (
    <div className="bg-white min-h-screen font-sans animate-pulse">
      
      {/* Breadcrumb Skeleton */}
      <div className="bg-gray-100 py-4 mb-8">
         <div className="container mx-auto px-6">
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
         </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Image Gallery Skeleton */}
            <div className="space-y-4">
               {/* Main Image */}
               <div className="aspect-square bg-gray-200 rounded-xl"></div>
               {/* Thumbnails */}
               <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                  ))}
               </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="flex flex-col space-y-6">
               {/* Title */}
               <div className="h-10 w-3/4 bg-gray-200 rounded"></div>
               
               {/* Rating & Price */}
               <div className="flex gap-4">
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
               </div>

               {/* Description */}
               <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
               </div>

               {/* Buttons */}
               <div className="flex gap-4 pt-4">
                  <div className="h-12 w-32 bg-gray-200 rounded"></div> {/* Qty */}
                  <div className="h-12 flex-1 bg-gray-200 rounded"></div> {/* Add to Cart */}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}