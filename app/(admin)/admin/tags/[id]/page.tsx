// File: app/(admin)/admin/tags/[id]/page.tsx

import { getTag } from "@/app/actions/admin/tags/tag-actions";
import TagForm from "../_components/tag-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TagUpsertPage({ params }: Props) {
  const { id } = await params;
  const tag = id === 'create' ? null : await getTag(id);

  return (
    <div className="p-6 min-h-[85vh] flex items-center justify-center">
       <TagForm initialData={tag} />
    </div>
  );
}