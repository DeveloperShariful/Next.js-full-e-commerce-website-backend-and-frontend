//app/(admin)/admin/reviews/types.ts

export type ReviewStatus = "PENDING" | "APPROVED" | "SPAM" | "TRASH";

export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  status: string; // "pending", "approved", "rejected" (spam)
  images: string[];
  reply: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  product: {
    name: string;
    slug: string;
    featuredImage: string | null;
    _count?: {
      reviews: number; // 🚀 New: Total approved reviews for this product
    }
  };
}

export interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}