// app/admin/reviews/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getReviews, updateReviewStatus, deleteReview, ReviewData } from "@/app/actions/admin/review";
import { toast } from "react-hot-toast";
import { 
  Star, CheckCircle, XCircle, Trash2, 
  MessageSquare, User, Loader2, RefreshCcw 
} from "lucide-react";
import Image from "next/image";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const res = await getReviews(filter);
    if (res.success) {
      setReviews(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // --- HANDLERS ---
  const handleStatus = async (id: string, status: string) => {
    const res = await updateReviewStatus(id, status);
    if (res.success) {
      toast.success(res.message as string);
      fetchData();
    } else {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const res = await deleteReview(id);
    if (res.success) {
      toast.success(res.message as string);
      fetchData();
    }
  };

  // Helper to render stars
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
      />
    ));
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer feedback and ratings.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition ${
              filter === tab 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* REVIEWS LIST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         {loading ? (
             <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
         ) : reviews.length === 0 ? (
             <div className="p-20 text-center text-slate-500">No reviews found in this category.</div>
         ) : (
             <div className="divide-y divide-slate-100">
                 {reviews.map((review) => (
                     <div key={review.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-6">
                         
                         {/* Product Image */}
                         <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            {review.product?.image ? (
                                <img src={review.product.image} alt="" className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>}
                         </div>

                         {/* Content */}
                         <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    {review.title || "No Title"}
                                </span>
                             </div>
                             
                             <p className="text-sm text-slate-600 leading-relaxed">
                                {review.content}
                             </p>

                             <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <span className="font-medium text-slate-600 flex items-center gap-1">
                                    <User size={12}/> {review.user?.name || "Guest"}
                                </span>
                                <span>•</span>
                                <span>{review.user?.email}</span>
                                <span>•</span>
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="text-blue-600">On: {review.product?.name}</span>
                             </div>
                         </div>

                         {/* Status & Actions */}
                         <div className="flex flex-col items-end gap-2 min-w-[120px]">
                             {/* Status Badge */}
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                 review.status === 'approved' ? 'bg-green-100 text-green-700' :
                                 review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                 'bg-yellow-100 text-yellow-800'
                             }`}>
                                 {review.status}
                             </span>

                             {/* Actions */}
                             <div className="flex gap-1 mt-1">
                                 {review.status !== 'approved' && (
                                     <button 
                                       onClick={() => handleStatus(review.id, 'approved')}
                                       className="p-2 text-green-600 hover:bg-green-50 rounded border border-slate-200" title="Approve"
                                     >
                                         <CheckCircle size={16}/>
                                     </button>
                                 )}
                                 {review.status !== 'rejected' && (
                                     <button 
                                       onClick={() => handleStatus(review.id, 'rejected')}
                                       className="p-2 text-orange-500 hover:bg-orange-50 rounded border border-slate-200" title="Reject"
                                     >
                                         <XCircle size={16}/>
                                     </button>
                                 )}
                                 <button 
                                   onClick={() => handleDelete(review.id)}
                                   className="p-2 text-red-600 hover:bg-red-50 rounded border border-slate-200" title="Delete"
                                 >
                                     <Trash2 size={16}/>
                                 </button>
                             </div>
                         </div>

                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
}