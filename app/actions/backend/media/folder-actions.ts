//app/actions/admin/media/folder-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- 1. GET FOLDER TREE ---
export async function getFolderTree() {
  try {
    // Fetch all folders flat, we will build tree in frontend or keep flat with parentId
    // Adding _count to show how many files/subfolders inside
    const folders = await db.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { files: true, children: true }
        }
      }
    });
    return { success: true, data: folders };
  } catch (error) {
    return { success: false, error: "Failed to load folders" };
  }
}

// --- 2. CREATE FOLDER ---
export async function createFolder(name: string, parentId: string | null = null) {
  try {
    if(!name) return { success: false, message: "Name is required" };

    // Check duplicate in same level
    const existing = await db.mediaFolder.findFirst({
        where: { 
            name: { equals: name, mode: "insensitive" },
            parentId: parentId 
        }
    });

    if (existing) return { success: false, message: "Folder with this name already exists here." };

    const folder = await db.mediaFolder.create({
      data: {
        name,
        parentId
      }
    });

    revalidatePath("/admin/media");
    return { success: true, data: folder, message: "Folder created" };

  } catch (error) {
    return { success: false, message: "Create failed" };
  }
}

// --- 3. RENAME FOLDER ---
export async function renameFolder(id: string, newName: string) {
  try {
    await db.mediaFolder.update({
      where: { id },
      data: { name: newName }
    });
    revalidatePath("/admin/media");
    return { success: true, message: "Renamed successfully" };
  } catch (error) {
    return { success: false, message: "Rename failed" };
  }
}

// --- 4. DELETE FOLDER ---
// Logic: If a folder is deleted, we move its files to Root (parentId: null) OR Parent Folder
// We do NOT delete files inside to prevent data loss.
export async function deleteFolder(id: string) {
  try {
    const folder = await db.mediaFolder.findUnique({ where: { id } });
    if (!folder) return { success: false, message: "Folder not found" };

    // Move sub-folders to parent (or root)
    await db.mediaFolder.updateMany({
        where: { parentId: id },
        data: { parentId: folder.parentId }
    });

    // Move files to root (Safety First Approach)
    // Or you can move them to folder.parentId if you prefer hierarchy preservation
    await db.media.updateMany({
        where: { folderId: id },
        data: { folderId: folder.parentId } 
    });

    // Finally delete the folder
    await db.mediaFolder.delete({
        where: { id }
    });

    revalidatePath("/admin/media");
    return { success: true, message: "Folder deleted. Items moved to parent." };

  } catch (error) {
    console.error("FOLDER_DELETE_ERROR", error);
    return { success: false, message: "Failed to delete folder" };
  }
}