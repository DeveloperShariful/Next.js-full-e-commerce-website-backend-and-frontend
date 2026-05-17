// app/(frontend)/types.ts

export interface ProductAttributeNode {
  name: string;
  options: string[];
}

export interface StorefrontProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  __typename: "SimpleProduct" | "VariableProduct";
  
  // এখানেই সমস্যা ছিল। এখন ? যোগ করে দেওয়া হয়েছে।
  image?: { sourceUrl: string } | null; 
  
  price: string | null;
  regularPrice: string | null;
  salePrice: string | null;
  averageRating: number;
  reviewCount: number;
  onSale: boolean;
  attributes: {
    nodes: ProductAttributeNode[];
  };
}

export interface FeaturedBikesResponse {
  success: boolean;
  products: StorefrontProduct[];
  error?: string;
}