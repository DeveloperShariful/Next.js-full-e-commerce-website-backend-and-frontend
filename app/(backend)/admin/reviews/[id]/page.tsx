//app/(backend)/admin/reviews/[id]/page.tsx

import { getReviewById } from "@/app/actions/backend/review/actions";
import ReviewEditForm from "./_components/review-edit-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Review | Admin",
  description: "Edit product review details, status, and dates.",
};

export default async function EditReviewPage({ params }: Props) {
  const { id } = await params;
  
  // Fetching the review data securely from server
  const res = await getReviewById(id);

  if (!res.success || !res.data) {
    return notFound(); // Show 404 page if review doesn't exist
  }

  return (
    <div className="font-sans text-[#3c434a] max-w-[1200px] mx-auto pb-10">
      
      {/* 🚀 WP Style Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Edit Review</h1>
          <Link 
            href="/admin/reviews" 
            className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Back to Reviews
          </Link>
        </div>
      </div>

      {/* Passing the fetched data to the massive Client Component */}
      <ReviewEditForm initialData={res.data} />
      
    </div>
  );
}