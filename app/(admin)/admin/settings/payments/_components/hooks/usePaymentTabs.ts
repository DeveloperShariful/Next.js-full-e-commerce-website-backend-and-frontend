// app/admin/settings/payments/_components/hooks/usePaymentTabs.ts

import { useState } from "react"

export type TabType = 
  | "general" 
  | "methods" 
  | "express" 
  | "advanced" 
  | "webhooks" 
  | "danger" 
  | "paylater" 
  | "cheque"   
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