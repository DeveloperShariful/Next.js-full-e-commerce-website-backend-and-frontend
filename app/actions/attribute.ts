// app/actions/attribute.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // ডিটা ভ্যালিডেশনের জন্য Zod লাইব্রেরি

// ==============================================================================
// 1. ZOD SCHEMAS (VALIDATION RULES)
// ==============================================================================

// কালার কোড চেক করার জন্য Regex (যেমন: #FFFFFF)
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// অ্যাট্রিবিউট তৈরি বা আপডেটের নিয়মাবলী
const AttributeSchema = z.object({
  name: z.string().min(1, { message: "Attribute name is required" }),
  slug: z.string().optional(),
  type: z.enum(["TEXT", "COLOR", "BUTTON"]).default("TEXT"), // নতুন টাইপ ম্যানেজমেন্ট
  values: z.array(z.string()).min(1, { message: "At least one value is required" }),
});

// ডাটা আপডেট করার সময় ID লাগবেই
const UpdateAttributeSchema = AttributeSchema.extend({
  id: z.string().uuid(),
});

// ==============================================================================
// 2. TYPES & INTERFACES
// ==============================================================================

export type AttributeState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>; // ফর্মের এরর দেখানোর জন্য
  data?: any;
};

// ==============================================================================
// 3. GET ATTRIBUTES (SEARCH & PAGINATION)
// ==============================================================================

/**
 * অ্যাট্রিবিউট লিস্ট নিয়ে আসার ফাংশন।
 * @param query - সার্চ টেক্সট (নাম দিয়ে খোঁজার জন্য)
 * @param page - বর্তমান পেজ নম্বর
 * @param limit - প্রতি পেজে কয়টি ডাটা দেখাবে
 */
export async function getAttributes(
  query: string = "",
  page: number = 1,
  limit: number = 10
) {
  try {
    const skip = (page - 1) * limit;

    // ডাটা ফিল্টার করার লজিক
    const whereCondition = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    // প্যারালাল রিকোয়েস্ট: ডাটা এবং টোটাল কাউন্ট একসাথে নিয়ে আসা
    const [attributes, totalCount] = await Promise.all([
      db.attribute.findMany({
        where: whereCondition,
        orderBy: { updatedAt: "desc" }, // লেটেস্ট ডাটা আগে দেখাবে
        skip,
        take: limit,
      }),
      db.attribute.count({ where: whereCondition }),
    ]);

    // প্রোডাক্টে এই অ্যাট্রিবিউট কতবার ব্যবহার হয়েছে তার কাউন্ট বের করা (Optional Optimization)
    // এটি ড্যাশবোর্ডে "Usage Count" দেখানোর জন্য কাজে লাগবে
    const attributesWithUsage = await Promise.all(
      attributes.map(async (attr) => {
        const usageCount = await db.productAttribute.count({
          where: { name: attr.name }, // নাম দিয়ে ম্যাচ করা হচ্ছে
        });
        return { ...attr, count: usageCount };
      })
    );

    return {
      success: true,
      data: attributesWithUsage,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("GET_ATTRIBUTES_ERROR", error);
    return { success: false, message: "Failed to load attributes." };
  }
}

// ==============================================================================
// 4. GET SINGLE ATTRIBUTE (FOR EDIT)
// ==============================================================================

export async function getAttributeById(id: string) {
  try {
    const attribute = await db.attribute.findUnique({
      where: { id },
    });

    if (!attribute) return { success: false, message: "Attribute not found" };

    return { success: true, data: attribute };
  } catch (error) {
    return { success: false, message: "Error fetching attribute details." };
  }
}

// ==============================================================================
// 5. CREATE ATTRIBUTE (WITH VALIDATION)
// ==============================================================================

export async function createAttribute(prevState: any, formData: FormData): Promise<AttributeState> {
  try {
    // 1. FormData থেকে ডাটা বের করা
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      // ভ্যালুগুলোকে কমা (,) দিয়ে আলাদা করে অ্যারে বানানো হচ্ছে
      values: (formData.get("values") as string)
        ?.split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0) || [],
    };

    // 2. Zod দিয়ে ভ্যালিডেশন চেক করা
    const validatedFields = AttributeSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid input data",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, slug, type, values } = validatedFields.data;

    // 3. স্লাগ জেনারেট করা (যদি না থাকে) এবং ডুপ্লিকেট চেক
    let finalSlug = slug || name.toLowerCase().trim().replace(/ /g, "-");
    
    const existingAttribute = await db.attribute.findFirst({
      where: {
        OR: [{ slug: finalSlug }, { name: name }], // নাম বা স্লাগ কোনোটিই ডুপ্লিকেট হতে পারবে না
      },
    });

    if (existingAttribute) {
      return {
        success: false,
        message: `Attribute with name "${name}" or slug "${finalSlug}" already exists.`,
      };
    }

    // 4. কালার হ্যান্ডলিং (Type Management)
    // যদি টাইপ COLOR হয়, আমরা ভ্যালুগুলো চেক করব যে সেগুলো সঠিক ফরম্যাটে আছে কিনা
    // আমরা ধরে নিচ্ছি ফ্রন্টএন্ড থেকে ডাটা আসবে "Red|#FF0000" ফরম্যাটে অথবা সিম্পল টেক্সট
    // ডাটাবেসে সেভ করার আগে আমরা এটা প্রসেস করতে পারি, আপাতত সিম্পল রাখছি।

    // 5. ডাটাবেসে সেভ করা
    await db.attribute.create({
      data: {
        name,
        slug: finalSlug,
        values, // স্কিমাতে `type` ফিল্ড না থাকলে values এর মধ্যেই টাইপ হ্যান্ডেল করতে হবে
        // @ts-ignore: আপনার বর্তমান স্কিমায় 'type' ফিল্ড নেই, তাই ইগনোর করা হচ্ছে। 
        // আপনার স্কিমায় `type String @default("TEXT")` যোগ করার পরামর্শ রইলো।
      },
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute created successfully!" };

  } catch (error) {
    console.error("CREATE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Internal Server Error" };
  }
}

// ==============================================================================
// 6. UPDATE ATTRIBUTE (WITH SAFETY CHECKS)
// ==============================================================================

export async function updateAttribute(prevState: any, formData: FormData): Promise<AttributeState> {
  try {
    const rawData = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      values: (formData.get("values") as string)
        ?.split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0) || [],
    };

    const validatedFields = UpdateAttributeSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid input data",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { id, name, slug, values } = validatedFields.data;

    // 1. চেক করা অ্যাট্রিবিউট আদৌ আছে কিনা
    const existingAttr = await db.attribute.findUnique({ where: { id } });
    if (!existingAttr) {
      return { success: false, message: "Attribute not found." };
    }

    // 2. স্লাগ কনফ্লিক্ট চেক (নিজের স্লাগ বাদে অন্যের সাথে মিলছে কিনা)
    let finalSlug = slug || name.toLowerCase().trim().replace(/ /g, "-");
    const duplicateCheck = await db.attribute.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id: id },
      },
    });

    if (duplicateCheck) {
      return { success: false, message: "This slug is already used by another attribute." };
    }

    // 3. ডাটা আপডেট
    await db.attribute.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        values,
      },
    });

    // 4. (Advanced) Product Attribute Sync
    // যদি অ্যাট্রিবিউটের নাম পরিবর্তন হয়, তবে প্রোডাক্টের ভেতর থাকা পুরনো নামগুলোও আপডেট করা উচিত?
    // সাধারণত ই-কমার্সে এটি জটিল প্রক্রিয়া। আমরা আপাতত வ ওয়ার্নিং দিতে পারি বা ম্যানুয়ালি হ্যান্ডেল করতে পারি।
    // এখানে আমরা লজিক সিম্পল রাখছি, কিন্তু ফিউচারে এখানে বাল্ক আপডেটের কোড বসবে।

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute updated successfully." };

  } catch (error) {
    console.error("UPDATE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Failed to update attribute." };
  }
}

// ==============================================================================
// 7. DELETE ATTRIBUTE (WITH DEPENDENCY CHECK)
// ==============================================================================

export async function deleteAttribute(id: string) {
  try {
    // 1. অ্যাট্রিবিউট খুঁজে বের করা
    const attribute = await db.attribute.findUnique({ where: { id } });
    if (!attribute) return { success: false, message: "Attribute not found" };

    // 2. DEPENDENCY CHECK: এই অ্যাট্রিবিউট কোনো প্রোডাক্টে ব্যবহার হচ্ছে কিনা?
    // স্কিমা অনুযায়ী `ProductAttribute` টেবিলে `name` দিয়ে লিঙ্ক থাকে।
    const usageCount = await db.productAttribute.count({
      where: { name: attribute.name },
    });

    if (usageCount > 0) {
      // যদি ব্যবহার হয়ে থাকে, তবে ডিলিট আটকানো হবে
      return { 
        success: false, 
        message: `Cannot delete "${attribute.name}". It is currently used in ${usageCount} products. Please remove it from products first.` 
      };
    }

    // 3. সেইফ হলে ডিলিট করা
    await db.attribute.delete({ where: { id } });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute deleted successfully." };

  } catch (error) {
    console.error("DELETE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Internal error during deletion." };
  }
}