//app/(backend)/admin/brands/types.ts

export interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  countryOfOrigin: string | null;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  _count?: { products: number };
}