// File: app/(admin)/admin/brands/[id]/page.tsx

import { getBrand } from "@/app/actions/admin/brands/brand-actions";
import BrandForm from "../_components/brand-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BrandUpsertPage({ params }: Props) {
  const { id } = await params;
  const brand = id === 'create' ? null : await getBrand(id);

  return (
    <div className="p-6 min-h-[85vh]">
       <BrandForm initialData={brand} />
    </div>
  );
}