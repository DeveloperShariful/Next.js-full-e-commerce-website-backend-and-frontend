// File: app/product/[slug]/_components/reviews/review-form.tsx

"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import StarRating from "./star-rating"; // Make sure this path is correct
import { createReview } from "@/app/actions/storefront/product/review-actions";
import { useUser } from "@clerk/nextjs"; 
import ImageUpload from "@/components/ui/image-upload"; // Use your existing ImageUpload component

interface Props {
  productId: string;
}

export default function ReviewForm({ productId }: Props) {
  const { isSignedIn, user } = useUser();
  
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]); // 🚀 State for Images
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) return toast.error("Please select a rating!");
    if (!title.trim()) return toast.error("Title is required!");
    if (!content.trim()) return toast.error("Review content is required!");

    setLoading(true);
    
    const res = await createReview(productId, { 
        rating, 
        title, 
        content,
        images // 🚀 Pass images to server action
    });
    
    if (res.success) {
      toast.success(res.message);
      // Reset Form
      setRating(0);
      setTitle("");
      setContent("");
      setImages([]);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  if (!isSignedIn) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
        <p className="text-slate-600 mb-2 font-medium">Please log in to write a review.</p>
        <p className="text-xs text-slate-400">Only registered users can leave reviews.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">Write a Review</h3>
        <span className="text-xs text-slate-500">Posting as <strong>{user?.fullName}</strong></span>
      </div>
      
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
        <StarRating rating={rating} size={28} interactive onRate={setRating} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          placeholder="Summarize your experience"
          required
        />
      </div>

      {/* Review Content */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Review</label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none transition"
          placeholder="Tell us more about the product..."
          required
        />
      </div>

      {/* 🚀 Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Add Photos (Optional)</label>
        <ImageUpload 
            value={images}
            onChange={(url) => setImages((prev) => [...prev, url])}
            onRemove={(url) => setImages((prev) => prev.filter((i) => i !== url))}
        />
        <p className="text-xs text-slate-400 mt-1">You can upload multiple images.</p>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-md active:scale-95"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}