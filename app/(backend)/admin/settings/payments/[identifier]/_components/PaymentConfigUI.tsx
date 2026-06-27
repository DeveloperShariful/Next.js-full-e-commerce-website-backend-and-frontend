//File 8: app/admin/settings/payments/[identifier]/_components/PaymentConfigUI.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PaymentGatewayUI } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { ArrowLeft, CreditCard, Sliders, Activity, Webhook, Palette, Briefcase, Info, type LucideIcon } from "lucide-react"

// Import Stripe Components
import { Stripe_General_Form } from "./Stripe/Stripe_General_Form"
import { Stripe_Connection_Card } from "./Stripe/Stripe_Connection_Card"
import { Stripe_Advanced } from "./Stripe/Stripe_Advanced"
import { Stripe_Webhook_Config } from "./Stripe/Stripe_Webhook_Config"

// Import PayPal Components
import { Paypal_General_Form } from "./Paypal/Paypal_General_Form"
import { Paypal_Connection_Card } from "./Paypal/Paypal_Connection_Card"
import { Paypal_SmartButtons } from "./Paypal/Paypal_SmartButtons"
import { Paypal_Webhook_Config } from "./Paypal/Paypal_Webhook_Config"

// Import Offline Component
import { Offline_Payment_Form } from "./Offline/Offline_Payment_Form"

interface Props {
  method: PaymentGatewayUI
}

interface TabItem {
  id: string
  label: string
  icon: LucideIcon
}

// Tab Configurations
const STRIPE_MAIN_TABS: TabItem[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "connection", label: "Connection", icon: CreditCard },
  { id: "advanced", label: "Advanced", icon: Activity },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
]

// ★ FIX: Isolated Sub-Methods. They only get the General configuration tab.
const STRIPE_SUB_TABS: TabItem[] = [
  { id: "general", label: "Configuration", icon: Sliders },
]

const PAYPAL_TABS: TabItem[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "connection", label: "Connection", icon: CreditCard },
  { id: "smartbuttons", label: "Smart Buttons", icon: Palette },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
]

const OFFLINE_TABS: TabItem[] = [
  { id: "general", label: "Configuration", icon: Briefcase },
]

export const PaymentConfigUI = ({ method }: Props) => {
  const [activeTab, setActiveTab] = useState("general")

  let titleColor = "text-gray-900"
  let tabs: TabItem[] = OFFLINE_TABS

  // Check if it's Klarna, Afterpay, or Zip
  const isStripeSubMethod = method.provider === "STRIPE" && method.identifier !== "stripe"

  if (method.provider === "STRIPE") {
    titleColor = "text-[#2271b1]" // WordPress Classic Blue
    tabs = isStripeSubMethod ? STRIPE_SUB_TABS : STRIPE_MAIN_TABS
  } else if (method.provider === "PAYPAL") {
    titleColor = "text-[#2271b1]" // WordPress Classic Blue
    tabs = PAYPAL_TABS
  }

  const renderContent = () => {
    if (method.provider === "STRIPE") {
      switch (activeTab) {
        case "general": return <Stripe_General_Form method={method} />
        case "connection": return <Stripe_Connection_Card method={method} />
        case "advanced": return <Stripe_Advanced method={method} />
        case "webhooks": return <Stripe_Webhook_Config method={method} />
        default: return null
      }
    }
    
    if (method.provider === "PAYPAL") {
      switch (activeTab) {
        case "general": return <Paypal_General_Form method={method} />
        case "connection": return <Paypal_Connection_Card method={method} />
        case "smartbuttons": return <Paypal_SmartButtons method={method} />
        case "webhooks": return <Paypal_Webhook_Config method={method} />
        default: return null
      }
    }

    if (method.provider === "OFFLINE") {
      return <Offline_Payment_Form method={method} />
    }
    
    return null
  }

  return (
    <div className="w-full bg-[#f0f0f1] h-full font-sans text-[13px] text-[#3c434a]">
      
      <div className="w-full">
        
        {/* WordPress / WooCommerce Style Clean Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            href="/admin/settings?tab=payments" 
            className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[23px] font-normal flex items-center gap-2 m-0">
            <span className={titleColor}>{method.name}</span> 
            <span className="text-gray-500 font-light hidden sm:inline">Configuration</span>
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-6">
          
          {/* Left Sidebar Tabs */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-3 md:pb-0 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-all whitespace-nowrap text-left",
                    activeTab === tab.id
                      ? "bg-white text-[#2271b1] border-l-4 border-[#2271b1] shadow-sm"
                      : "text-[#3c434a] hover:bg-white/60 hover:text-[#2271b1] border-l-4 border-transparent"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 flex-shrink-0", activeTab === tab.id ? "text-[#2271b1]" : "text-gray-400")} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Content Area (Takes full remaining width) */}
          <main className="flex-1 w-full min-w-0">
            
            {/* ★ FIX: Clearer Notice for Sub-methods */}
            {isStripeSubMethod && (
               <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#2271b1] shadow-sm flex items-start gap-3">
                 <Info className="h-5 w-5 text-[#2271b1] flex-shrink-0 mt-0.5" />
                 <div className="text-[13px] text-[#3c434a]">
                   <p className="m-0 font-semibold mb-1">Inherited Credentials Mode</p>
                   <p className="m-0">
                     This payment method uses the API keys and Webhooks securely inherited from your main <strong>Credit / Debit Card (Stripe)</strong> configuration. 
                     You only need to configure the title, description, and visibility settings below.
                   </p>
                 </div>
               </div>
            )}
            
            {/* Forms Render Here (Inside WooCommerce style white box) */}
            <div className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderContent()}
            </div>
            
          </main>

        </div>
      </div>
    </div>
  )
}