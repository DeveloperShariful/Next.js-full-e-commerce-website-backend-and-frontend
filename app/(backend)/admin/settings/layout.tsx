"use client"

// app/(backend)/admin/settings/layout.tsx

import { usePathname } from "next/navigation"
import SettingsTabNav from "./_components/SettingsTabNav"

const SETTINGS_ROOT_PATHS = [
  "/admin/settings",
  "/admin/settings/general",
  "/admin/settings/shipping",
  "/admin/settings/payments",
  "/admin/settings/email",
  "/admin/settings/my-account",
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRootPage = SETTINGS_ROOT_PATHS.includes(pathname)

  return (
    <div
      className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] antialiased"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      }}
    >
      <div className="w-full">
        {isRootPage && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-y-1.5 gap-x-8 mb-4 border-b border-slate-200">
            <h1 className="text-[20px] font-bold text-slate-900 m-0 pb-2.5 leading-none shrink-0">
              Settings
            </h1>
            <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
              <SettingsTabNav />
            </div>
          </div>
        )}
        <div className="animate-in fade-in duration-150 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
