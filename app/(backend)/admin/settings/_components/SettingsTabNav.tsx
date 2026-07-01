"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { label: "General",    href: "/admin/settings/general"    },
  { label: "Shipping",   href: "/admin/settings/shipping"   },
  { label: "Payments",   href: "/admin/settings/payments"   },
  { label: "Emails",     href: "/admin/settings/email"      },
  { label: "My Account", href: "/admin/settings/my-account" },
]

export default function SettingsTabNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-[4px] border-b border-[#c3c4c7] mb-[20px]">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-[14px] px-[15px] py-[8px] font-semibold transition-all duration-150 border border-b-0 rounded-t-[3px] outline-none ${
              isActive
                ? "border-[#c3c4c7] bg-[#f0f0f1] text-[#1d2327] -mb-[1px] pb-[9px]"
                : "border-transparent bg-transparent text-[#2271b1] hover:text-[#135e96]"
            }`}
            style={{ lineHeight: "1.71428571" }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
