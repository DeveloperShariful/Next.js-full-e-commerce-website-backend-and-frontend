// File: app/(admin)/admin/settings/affiliate/page.tsx

import { redirect } from "next/navigation";

/**
 * ROOT PAGE
 * Automatically redirects to the first tab (General Settings).
 */
export default function AffiliateSettingsRootPage() {
  redirect("/admin/settings/affiliate/general");
}