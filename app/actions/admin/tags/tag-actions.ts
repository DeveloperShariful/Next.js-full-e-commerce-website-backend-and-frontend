// File: app/actions/admin/tags/tag-actions.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTags() {
  try {
    const tags = await db.tag.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true } } }
    });
    return { success: true, data: tags };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function getTag(id: string) {
  try {
    const tag = await db.tag.findUnique({ where: { id } });
    return tag;
  } catch (error) {
    return null;
  }
}

export async function upsertTag(formData: FormData, id?: string) {
  const name = formData.get("name") as string;
  let slug = (formData.get("slug") as string) || name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const metaTitle = formData.get("metaTitle") as string;
  const metaDesc = formData.get("metaDesc") as string;

  if (!name) return { success: false, message: "Name is required" };

  try {
    const data = {
        name,
        slug,
        description,
        color,
        metaTitle,
        metaDesc
    };

    if (id) {
      await db.tag.update({ where: { id }, data });
    } else {
      await db.tag.create({ data });
    }
    revalidatePath("/admin/tags");
    return { success: true, message: id ? "Tag updated!" : "Tag created!" };
  } catch (error: any) {
    if (error.code === 'P2002') {
        return { success: false, message: "Slug already exists." };
    }
    return { success: false, message: "Operation failed." };
  }
}

export async function deleteTag(id: string) {
  try {
    await db.tag.delete({ where: { id } });
    revalidatePath("/admin/tags");
    return { success: true, message: "Tag deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete tag" };
  }
}