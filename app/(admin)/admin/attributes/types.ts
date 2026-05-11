//app/(admin)/admin/attributes/types.ts

export interface AttributeData {
  id: string;
  name: string;
  slug: string;
  type: "TEXT" | "COLOR" | "BUTTON";
  values: string[];
  count: number; // Usage count attached from backend
  deletedAt: Date | null;
}