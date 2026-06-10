//app/actions/backend/tag-manager/gtm.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// HELPER: GET AUTHENTICATED GTM CLIENT
// ============================================================================
async function getGtmClient() {
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
    select: { googleRefreshToken: true }
  });

  if (!config?.googleRefreshToken) {
    throw new Error("Google account is not fully connected.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });

  return google.tagmanager({ version: "v2", auth: oauth2Client });
}

// ============================================================================
// 1. FETCH GTM ACCOUNTS & CONTAINERS
// ============================================================================
export async function fetchGtmAccountsAndContainers() {
  try {
    const gtm = await getGtmClient();

    const accountsRes = await gtm.accounts.list();
    const accounts = accountsRes.data.account || [];

    if (accounts.length === 0) {
      return { success: true, accounts: [] };
    }

    const formattedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        try {
          const containersRes = await gtm.accounts.containers.list({
            parent: `accounts/${acc.accountId}`
          });
          const containers = containersRes.data.container || [];

          const formattedContainers = containers.map(c => ({
            id: c.containerId,
            publicId: c.publicId, 
            name: c.name,
            path: c.path 
          }));

          return {
            accountId: acc.accountId,
            accountName: acc.name,
            containers: formattedContainers
          };
        } catch (e) {
          console.warn(`Failed to fetch containers for GTM Account ${acc.accountId}`);
          return {
            accountId: acc.accountId,
            accountName: acc.name,
            containers: []
          };
        }
      })
    );

    return { success: true, accounts: formattedAccounts };
  } catch (error: any) {
    console.error("Error fetching GTM Accounts:", error.message);
    return { success: false, error: "Failed to load GTM Accounts from Google." };
  }
}

// ============================================================================
// 2. FETCH LIVE GTM WORKSPACE DETAILS
// ============================================================================
export async function fetchGtmWorkspaceDetails(accountPath: string, containerId: string) {
  try {
    const gtm = await getGtmClient();
    const parentPath = `${accountPath}/containers/${containerId}`;

    const workspacesRes = await gtm.accounts.containers.workspaces.list({
      parent: parentPath
    });
    const workspaces = workspacesRes.data.workspace || [];
    if (workspaces.length === 0) return { success: false, error: "No active GTM workspace found." };

    const activeWorkspacePath = workspaces[0].path!; 

    const [tagsRes, triggersRes, variablesRes, foldersRes] = await Promise.all([
      gtm.accounts.containers.workspaces.tags.list({ parent: activeWorkspacePath }).catch(() => null),
      gtm.accounts.containers.workspaces.triggers.list({ parent: activeWorkspacePath }).catch(() => null),
      gtm.accounts.containers.workspaces.variables.list({ parent: activeWorkspacePath }).catch(() => null),
      gtm.accounts.containers.workspaces.folders.list({ parent: activeWorkspacePath }).catch(() => null)
    ]);

    const tags = (tagsRes?.data?.tag || []).map(t => ({
      id: t.tagId,
      name: t.name,
      type: t.type?.replace(/_/g, " "), 
      liveState: t.paused ? "Paused" : "Active"
    }));

    const triggers = (triggersRes?.data?.trigger || []).map(tr => ({
      id: tr.triggerId,
      name: tr.name,
      type: tr.type?.replace(/_/g, " ")
    }));

    const variables = (variablesRes?.data?.variable || []).map(v => ({
      id: v.variableId,
      name: v.name,
      type: v.type?.replace(/_/g, " ")
    }));

    const folders = (foldersRes?.data?.folder || []).map(f => ({
      id: f.folderId,
      name: f.name
    }));

    return {
      success: true,
      data: {
        workspaceName: workspaces[0].name,
        tags,
        triggers,
        variables,
        folders
      }
    };

  } catch (error: any) {
    console.error("Error fetching GTM Workspace details:", error.message);
    return { success: false, error: error.message || "Failed to load GTM details." };
  }
}

// ============================================================================
// 3. SAVE SELECTED GTM CONTAINER ID TO DATABASE
// ============================================================================
export async function saveGtmContainerId(containerId: string) {
  try {
    if (!containerId) return { success: false, error: "Container ID is required." };

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gtmContainerId: containerId,
        gtmEnabled: true
      }
    });

    revalidatePath("/admin/marketing/gtm");
    return { success: true, message: "Google Tag Manager ID connected successfully!" };
  } catch (error: any) {
    console.error("Error saving GTM Container ID:", error);
    return { success: false, error: "Failed to save GTM Container ID." };
  }
}

// ============================================================================
// 🚀 4. NEW: GET CURRENT GTM DATABASE CONFIG (For Page Refresh Persistence)
// ============================================================================
export async function getGtmConfig() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        googleAccountId: true,
        googleAccountImage: true,
        gtmContainerId: true,
        gtmEnabled: true
      }
    });
    return { success: true, config };
  } catch (error: any) {
    console.error("Error reading GTM config:", error);
    return { success: false, error: "Failed to read database configuration." };
  }
}