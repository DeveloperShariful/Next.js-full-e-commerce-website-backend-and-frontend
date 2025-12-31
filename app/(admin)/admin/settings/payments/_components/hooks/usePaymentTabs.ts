// app/admin/settings/payments/_components/hooks/usePaymentTabs.ts

import { useState } from "react"

// সব ধরণের ট্যাবের নাম এখানে ডিফাইন করা হলো
export type TabType = 
  | "general" 
  | "methods" 
  | "express" 
  | "advanced" 
  | "webhooks" 
  | "danger" 
  | "paylater" // PayPal এর জন্য
  | "cheque"   // Offline methods এর জন্য
  | "cod"
  | "bank"

export function usePaymentTabs(defaultTab: TabType = "general") {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  const changeTab = (tab: TabType) => {
    setActiveTab(tab)
  }

  return {
    activeTab,
    changeTab,
    isTabActive: (tab: TabType) => activeTab === tab
  }
}