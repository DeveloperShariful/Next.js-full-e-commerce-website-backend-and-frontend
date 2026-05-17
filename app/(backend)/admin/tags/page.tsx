// File: app/(backend)/admin/tags/page.tsx

import TagView from "./_components/tag-view";

export const metadata = {
  title: "Tags | Admin",
  description: "Manage product tags for grouping and filtering",
};

export default function TagsPage() {
  return <TagView />;
}