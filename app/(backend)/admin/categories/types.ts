// File: app/(backend)/admin/categories/types.ts
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  menuOrder: number; // Schema Field
  metaTitle: string | null;
  metaDesc: string | null;
  deletedAt: Date | null; // 🚀 NEW: Added to track trash status
  _count?: { products: number };
  parent?: { name: string };
  children?: CategoryData[];
}