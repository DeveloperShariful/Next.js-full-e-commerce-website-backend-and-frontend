//app/(backend)/admin/tags/types.ts

export interface TagData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  _count?: { products: number };
}