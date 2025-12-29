// File: app/(admin)/admin/categories/types.ts
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
  _count?: { products: number };
  parent?: { name: string };
  children?: CategoryData[];
}