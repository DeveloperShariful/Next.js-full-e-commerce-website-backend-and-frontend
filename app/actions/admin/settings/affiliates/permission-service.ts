//File: app/actions/admin/settings/affiliate/permission-service.ts

"use server";

import { syncUser } from "@/lib/auth-sync";
import { Role } from "@prisma/client";
import { AffiliatePermission } from "./types";

// ✅ UPDATED: Added "MANAGE_FRAUD" to Admin & Super Admin
const PERMISSIONS: Record<Role, AffiliatePermission[]> = {
  SUPER_ADMIN: ["VIEW_ANALYTICS", "MANAGE_PARTNERS", "MANAGE_FINANCE", "MANAGE_CONFIGURATION", "MANAGE_NETWORK", "MANAGE_FRAUD"],
  ADMIN:       ["VIEW_ANALYTICS", "MANAGE_PARTNERS", "MANAGE_FINANCE", "MANAGE_CONFIGURATION", "MANAGE_NETWORK", "MANAGE_FRAUD"],
  MANAGER:     ["VIEW_ANALYTICS", "MANAGE_PARTNERS", "MANAGE_FINANCE"], 
  EDITOR:      ["VIEW_ANALYTICS", "MANAGE_PARTNERS"],
  SUPPORT:     ["VIEW_ANALYTICS"],
  CUSTOMER:    [],
  AFFILIATE:   []
};

export async function protectAction(required: AffiliatePermission) {
  const user = await syncUser();
  
  if (!user) {
    throw new Error("Unauthorized: User not authenticated.");
  }

  const userPerms = PERMISSIONS[user.role] || [];
  
  if (!userPerms.includes(required)) {
    throw new Error(`Forbidden: Access denied.`);
  }

  return user;
}