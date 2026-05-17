// File: app/(backend)/admin/brands/page.tsx

import BrandView from "./_components/brand-view";

export const metadata = {
  title: "Brands | Admin",
  description: "Manage product brands, logos and SEO",
};

export default function BrandsPage() {
  return <BrandView />;
}