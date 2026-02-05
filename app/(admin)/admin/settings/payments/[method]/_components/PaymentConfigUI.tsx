//File: app/admin/settings/payments/[method]/_components/PaymentConfigUI.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PaymentMethodWithConfig } from "@/app/(admin)/admin/settings/payments/types"

// Icons
import { 
  ArrowLeft, CreditCard, Sliders, Activity, Webhook, 
  Palette, MessageSquare, AlertTriangle, Settings 
} from "lucide-react"
import { Button } from "@/components/ui/button"

// --- STRIPE COMPONENTS ---
import { Stripe_General_Form } from "../_components/Stripe/Stripe_General_Form"
import { Stripe_Connection_Card } from "../_components/Stripe/Stripe_Connection_Card"
import { Stripe_Advanced } from "../_components/Stripe/Stripe_Advanced"
import { Stripe_Webhook_Config } from "../_components/Stripe/Stripe_Webhook_Config"

// --- PAYPAL COMPONENTS ---
import { Paypal_General_Form } from "../_components/Paypal/Paypal_General_Form"
import { Paypal_Connection_Tabs } from "../_components/Paypal/Paypal_Connection_Tabs"
import { Paypal_Webhook_Tab } from "../_components/Paypal/Paypal_Webhook_Tab"
import { Paypal_SmartButtons } from "../_components/Paypal/Paypal_SmartButtons"
import { Paypal_PayLater } from "../_components/Paypal/Paypal_PayLater"
import { Paypal_Advanced } from "../_components/Paypal/Paypal_Advanced"
import { Paypal_Danger_Zone } from "../_components/Paypal/Paypal_Danger_Zone"

// --- OFFLINE COMPONENTS ---
import { Bank_Transfer_Form } from "../_components/Bank_Transfer_Form"
import { Cheque_Form } from "../_components/Cheque_Form"
import { COD_Form } from "../_components/COD_Form"

interface Props {
  method: PaymentMethodWithConfig
}

interface TabItem {
  id: string
  label: string
  icon: any
  variant?: "default" | "destructive" 
}
// ------------------------------------------
// TAB DEFINITIONS
// ------------------------------------------
const STRIPE_TABS = [
  { id: "general", label: "General", icon: Sliders },
  { id: "methods", label: "Connection", icon: CreditCard },
  { id: "advanced", label: "Advanced", icon: Activity },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
]

const PAYPAL_TABS = [
  { id: "general", label: "General", icon: Sliders },
  { id: "methods", label: "Connection", icon: CreditCard },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "express", label: "Button Style", icon: Palette },
  { id: "paylater", label: "Pay Later", icon: MessageSquare },
  { id: "advanced", label: "Advanced", icon: Activity },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, variant: "destructive" as const },
]

const OFFLINE_TABS = [
  { id: "general", label: "Configuration", icon: Sliders },
]

export const PaymentConfigUI = ({ method }: Props) => {
  const [activeTab, setActiveTab] = useState("general")
  let titleColor = "text-gray-900"
  let tabs: TabItem[] = OFFLINE_TABS

  if (method.identifier === "stripe") {
    titleColor = "text-[#635BFF]"
    tabs = STRIPE_TABS
  } else if (method.identifier === "paypal") {
    titleColor = "text-[#003087]"
    tabs = PAYPAL_TABS
  }

  // 2. Render Content Logic
  const renderContent = () => {
    // --- STRIPE ---
    if (method.identifier === "stripe" && method.stripeConfig) {
      switch (activeTab) {
        case "general": return <Stripe_General_Form method={method} config={method.stripeConfig} />
        case "methods": return <Stripe_Connection_Card config={method.stripeConfig} methodId={method.id} />
        case "advanced": return <Stripe_Advanced method={method} config={method.stripeConfig} />
        case "webhooks": return <Stripe_Webhook_Config methodId={method.id} config={method.stripeConfig} />
        default: return null
      }
    }

    // --- PAYPAL ---
    if (method.identifier === "paypal" && method.paypalConfig) {
      switch (activeTab) {
        case "general": return <Paypal_General_Form method={method} config={method.paypalConfig} />
        case "methods": return <Paypal_Connection_Tabs config={method.paypalConfig} methodId={method.id} />
        case "webhooks": return <Paypal_Webhook_Tab config={method.paypalConfig} methodId={method.id} />
        case "express": return <Paypal_SmartButtons method={method} config={method.paypalConfig} />
        case "paylater": return <Paypal_PayLater method={method} config={method.paypalConfig} />
        case "advanced": return <Paypal_Advanced method={method} config={method.paypalConfig} />
        case "danger": return <Paypal_Danger_Zone methodId={method.id} />
        default: return null
      }
    }

    // --- OFFLINE (Bank, Cheque, COD) ---
    switch (method.identifier) {
      case "bank_transfer": return <Bank_Transfer_Form methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      case "cheque": return <Cheque_Form methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      case "cod": return <COD_Form methodId={method.id} config={method} offlineConfig={method.offlineConfig} />
      default: return <div className="p-4 text-red-500">Unknown payment method configuration.</div>
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50/50">
      
      {/* === HEADER === */}
      <div className="bg-white border-b px-4 md:px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm md:shadow-none">
        <Link href="/admin/settings/payments">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2 truncate">
          <span className={titleColor}>{method.name}</span> <span className="hidden sm:inline">Configuration</span>
        </h1>
      </div>

      <div className="flex flex-col md:flex-row flex-1 max-w-7xl mx-auto w-full md:border-x md:bg-white md:shadow-sm md:my-4 md:rounded-lg overflow-hidden">
        
        <div className="w-full md:w-64 bg-white md:bg-gray-50/30 border-b md:border-b-0 md:border-r flex-shrink-0 flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto md:overflow-y-auto scrollbar-hide sticky top-[65px] md:static z-10 shadow-sm md:shadow-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 border md:border-none",
                activeTab === tab.id
                  ? tab.variant === "destructive"
                    ? "bg-red-50 text-red-900 border-red-200 md:border-transparent"
                    : "bg-[#F3F4F6] md:bg-white text-primary border-gray-200 md:shadow-sm md:border-gray-200"
                  : tab.variant === "destructive"
                    ? "text-red-600 hover:bg-red-50 border-transparent"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground border-transparent"
              )}
            >
              <tab.icon className={cn("h-4 w-4 flex-shrink-0", 
                activeTab === tab.id && tab.variant !== "destructive" ? "text-primary" : ""
              )} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* === CONTENT AREA === */}
        <div className="flex-1 p-4 md:p-8 bg-gray-50/50 md:bg-white min-h-[500px]">
          <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderContent()}
          </div>
        </div>

      </div>
    </div>
  )
}