"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { klaviyoIdentify } from "@/lib/klaviyo";

export default function KlaviyoIdentifier() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;
    const parts = (session.user.name ?? "").trim().split(" ");
    klaviyoIdentify({
      email: session.user.email,
      first_name: parts[0] || undefined,
      last_name: parts.slice(1).join(" ") || undefined,
    });
  }, [session?.user?.email]);

  return null;
}
