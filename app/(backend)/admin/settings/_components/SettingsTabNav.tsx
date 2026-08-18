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
    <nav className="flex flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors outline-none ${
              isActive
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-blue-600" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
