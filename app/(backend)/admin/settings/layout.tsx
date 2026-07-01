// app/(backend)/admin/settings/layout.tsx

import SettingsTabNav from "./_components/SettingsTabNav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] antialiased"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      }}
    >
      <div className="w-full">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 mb-[15px] leading-tight">
          Settings
        </h1>
        <SettingsTabNav />
        <div className="animate-in fade-in duration-150 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
