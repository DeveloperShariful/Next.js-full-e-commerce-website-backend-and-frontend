// File: app/actions/settings/email/email-config.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmailConfiguration() {
  try {
    let config = await db.emailConfiguration.findUnique({
      where: { id: "email_config" }
    });

    if (!config) {
      config = await db.emailConfiguration.create({
        data: {
          id: "email_config",
          senderName: "GoBike",
          senderEmail: "gobike@gobike.au",
          footerText: "© 2025 GoBike. All rights reserved."
        }
      });
    }

    return { success: true, data: config };
  } catch (error) {
    console.error("GET_EMAIL_CONFIG_ERROR", error);
    return { success: false, error: "Failed to fetch configuration" };
  }
}

export async function saveEmailConfiguration(formData: FormData) {
  try {
    const senderName = formData.get("senderName") as string;
    const senderEmail = formData.get("senderEmail") as string;
    
    // SMTP
    const smtpHost = formData.get("smtpHost") as string;
    const smtpPort = parseInt(formData.get("smtpPort") as string) || 587;
    const smtpUser = formData.get("smtpUser") as string;
    const smtpPassword = formData.get("smtpPassword") as string;
    const encryption = formData.get("encryption") as string || "tls";
    
    // Branding
    const headerImage = formData.get("headerImage") as string;
    const footerText = formData.get("footerText") as string;
    const baseColor = formData.get("baseColor") as string;
    const backgroundColor = formData.get("backgroundColor") as string;
    const bodyBackgroundColor = formData.get("bodyBackgroundColor") as string;
    
    const isActive = formData.get("isActive") === "true";

    await db.emailConfiguration.upsert({
      where: { id: "email_config" },
      update: {
        senderName, senderEmail,
        smtpHost, smtpPort, smtpUser, smtpPassword, encryption,
        headerImage, footerText, baseColor, backgroundColor, bodyBackgroundColor,
        isActive
      },
      create: {
        id: "email_config",
        senderName, senderEmail,
        smtpHost, smtpPort, smtpUser, smtpPassword, encryption,
        headerImage, footerText, baseColor, backgroundColor, bodyBackgroundColor,
        isActive
      }
    });

    revalidatePath("/admin/settings/email");
    return { success: true, message: "Email settings saved successfully" };
  } catch (error) {
    console.error("SAVE_EMAIL_CONFIG_ERROR", error);
    return { success: false, error: "Failed to save settings" };
  }
}