// File: app/(admin)/admin/categories/page.tsx
import CategoryView from "./_components/category-view";

export const metadata = {
  title: "Categories | Admin",
  description: "Manage product categories, hierarchy and SEO",
};

export default function CategoriesPage() {
  return <CategoryView />;
}