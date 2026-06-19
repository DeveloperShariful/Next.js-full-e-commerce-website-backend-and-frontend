// app/(backend)/admin/settings/email/templates/[id]/edit/page.tsx

import { redirect } from "next/navigation";
import { getEmailTemplateById } from "@/app/actions/backend/settings/email/email-templates";
import { TemplateEditPageClient } from "@/app/(backend)/admin/settings/_components/email/template-edit-page-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditPage({ params }: Props) {
  const { id } = await params;
  const result = await getEmailTemplateById(id);

  if (!result.success || !result.data) {
    redirect("/admin/settings?tab=email");
  }

  return (
    <TemplateEditPageClient template={result.data} />
  );
}
