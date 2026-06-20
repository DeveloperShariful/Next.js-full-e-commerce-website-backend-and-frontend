// app/actions/backend/settings/my-account/tab-config.ts
// Shared config for My Account tab visibility (admin-controlled show/hide).
// Core tabs (dashboard, profile) are always visible and not toggleable.
// NOTE: plain module (no "use server") so constants can be imported by both
// the admin component and the frontend my-account page.

import { z } from "zod";

export interface ToggleableTab {
  id: string;
  label: string;
}

// These ids MUST match MENU_ITEMS ids in account-main-view.tsx
export const TOGGLEABLE_TABS: ToggleableTab[] = [
  { id: "orders", label: "Orders" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "wallet", label: "My Wallet" },
  { id: "addresses", label: "Addresses" },
  { id: "tickets", label: "Support Tickets" },
  { id: "warranty", label: "Warranty Claims" },
  { id: "wishlist", label: "Wishlist" },
];

export type TabVisibility = Record<string, boolean>;

// Default: every toggleable tab is visible.
export const DEFAULT_TAB_VISIBILITY: TabVisibility = TOGGLEABLE_TABS.reduce(
  (acc, tab) => ({ ...acc, [tab.id]: true }),
  {} as TabVisibility
);

const TabVisibilityZod = z.record(z.string(), z.boolean());

/**
 * Safely extract the My Account tab-visibility map out of StoreSettings.generalConfig.
 * Any missing / malformed value falls back to "visible" so existing behaviour never breaks.
 */
export function parseTabVisibility(generalConfig: unknown): TabVisibility {
  let stored: TabVisibility = {};

  if (generalConfig && typeof generalConfig === "object" && "myAccountTabs" in generalConfig) {
    const parsed = TabVisibilityZod.safeParse(
      (generalConfig as Record<string, unknown>).myAccountTabs
    );
    if (parsed.success) stored = parsed.data;
  }

  // Merge over defaults so unknown/legacy ids stay visible.
  const result: TabVisibility = { ...DEFAULT_TAB_VISIBILITY };
  for (const tab of TOGGLEABLE_TABS) {
    if (typeof stored[tab.id] === "boolean") result[tab.id] = stored[tab.id];
  }
  return result;
}
