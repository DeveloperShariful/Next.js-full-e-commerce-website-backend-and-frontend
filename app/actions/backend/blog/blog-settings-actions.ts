"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const DEFAULT_SETTINGS = {
  id: "singleton",
  blogTitle: "GoBike Blog",
  blogDescription: "Expert tips, safety guides, and inspiring stories for your little rider.",
  heroImage: "https://gobikes.au/wp-content/uploads/2025/10/best-electric-bike-for-kids-australia-gobike.webp",
  postsPerPage: 12,
  commentsEnabled: true,
  commentModeration: true,
  shareEnabled: true,
  sharePlatforms: ["facebook", "twitter", "linkedin", "whatsapp", "copy"],
  defaultKeyTakeaways: [
    "Electric balance bikes teach real motor skills in a safe, low-pressure environment — far better than training wheels.",
    "Always look for adjustable speed limiters; parent-controlled safety is essential while kids are still learning.",
    "Genuine hydraulic suspension is a must for riding on grass, dirt, or uneven surfaces — avoid hard plastic bikes.",
    "Choose Lithium-ion batteries rated for 45–60 minutes of continuous ride time on a single charge.",
    "Buy from an Australian-based retailer for reliable warranty, local customer support, and spare-parts availability.",
  ],
  defaultAuthorBio:
    "Australia's leading provider of premium electric balance bikes for kids — getting children outside and building real confidence.",
};

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user) return null;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) return null;
  return user;
}

export async function getBlogSettings() {
  try {
    const settings = await db.blogSettings.upsert({
      where: { id: "singleton" },
      create: DEFAULT_SETTINGS,
      update: {},
    });
    return { success: true, data: settings };
  } catch {
    return { success: false, data: null };
  }
}

export type BlogSettingsFormData = {
  blogTitle?: string;
  blogDescription?: string;
  heroImage?: string;
  postsPerPage?: number;
  commentsEnabled?: boolean;
  commentModeration?: boolean;
  shareEnabled?: boolean;
  sharePlatforms?: string[];
  defaultKeyTakeaways?: string[];
  defaultAuthorBio?: string;
};

export async function updateBlogSettings(data: BlogSettingsFormData) {
  const admin = await getAdminUser();
  if (!admin) return { success: false, error: "Unauthorized" };

  try {
    const settings = await db.blogSettings.upsert({
      where: { id: "singleton" },
      create: { ...DEFAULT_SETTINGS, ...data },
      update: data,
    });
    revalidatePath("/admin/blog/settings");
    revalidatePath("/blog");
    return { success: true, data: settings };
  } catch {
    return { success: false, error: "Failed to save settings" };
  }
}
