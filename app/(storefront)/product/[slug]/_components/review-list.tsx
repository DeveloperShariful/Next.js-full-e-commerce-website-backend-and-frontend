// File: app/product/[slug]/_components/reviews/review-list.tsx

import Image from "next/image";
import StarRating from "./star-rating";
import { format } from "date-fns";

interface Props {
  reviews: any[];
}

export default function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
        <div className="py-10 text-center">
            <p className="text-slate-500 mb-1">No reviews yet.</p>
            <p className="text-xs text-slate-400">Be the first to share your thoughts!</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
          
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              {review.user?.image ? (
                <Image src={review.user.image} alt={review.user.name || "User"} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-bold text-gray-500 uppercase">
                  {review.user?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            
            <div>
              <p className="font-bold text-sm text-slate-900">{review.user?.name || "Anonymous"}</p>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size={14} />
                <span className="text-xs text-slate-400 border-l border-slate-300 pl-2 ml-1">
                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <h4 className="font-bold text-slate-800 mb-1 text-base">{review.title}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>

          {/* 🚀 Review Images Gallery */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {review.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition">
                        <Image src={img} alt="Review Image" fill className="object-cover" />
                    </div>
                ))}
            </div>
          )}

          {/* Admin Reply */}
          {review.reply && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm text-slate-600 border-l-4 border-blue-500">
              <span className="font-bold block mb-1 text-blue-700">Store Reply:</span>
              {review.reply}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}