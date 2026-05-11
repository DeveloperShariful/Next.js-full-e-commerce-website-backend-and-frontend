// app/admin/attributes/page.tsx

import AttributeView from "./_components/attribute-view";

export const metadata = {
  title: "Attributes | Admin",
  description: "Manage product attributes and variations",
};

export default function AttributesPage() {
  return <AttributeView />;
}