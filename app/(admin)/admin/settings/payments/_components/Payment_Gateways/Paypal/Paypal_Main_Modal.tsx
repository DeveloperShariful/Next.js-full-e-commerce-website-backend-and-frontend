// app/admin/settings/payments/_components/Payment_Gateways/Paypal/Paypal_Main_Modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, CreditCard, Sliders, Activity, Palette, MessageSquare, AlertTriangle, Webhook } from "lucide-react"
import { PaymentMethodWithConfig } from "@/app/(admin)/admin/settings/payments/types"
import { cn } from "@/lib/utils"

// Hook & Type Import
import { usePaymentTabs, TabType } from "../../hooks/usePaymentTabs"

// Components Import
import { Paypal_General_Form } from "./Paypal_General_Form"
import { Paypal_Connection_Tabs } from "./Paypal_Connection_Tabs"
import { Paypal_SmartButtons } from "./Paypal_SmartButtons"
import { Paypal_PayLater } from "./Paypal_PayLater"
import { Paypal_Advanced } from "./Paypal_Advanced"
import { Paypal_Danger_Zone } from "./Paypal_Danger_Zone"
import { Paypal_Webhook_Tab } from "./Paypal_Webhook_Tab"

interface PaypalMainModalProps {
  method: PaymentMethodWithConfig
}

export const Paypal_Main_Modal = ({ method }: PaypalMainModalProps) => {
  const [open, setOpen] = useState(false)
  const { activeTab, changeTab, isTabActive } = usePaymentTabs("general")
  
  const paypalConfig = method.paypalConfig
  if (!paypalConfig) return null

  // 🛠️ Typed Tabs Array (Clean Code)
  const tabs: { id: TabType; label: string; icon: any; variant?: "default" | "destructive" }[] = [
    { id: "general", label: "General", icon: Sliders },
    { id: "methods", label: "Connection", icon: CreditCard },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "express", label: "Button Style", icon: Palette },
    { id: "paylater", label: "Pay Later", icon: MessageSquare },
    { id: "advanced", label: "Advanced", icon: Activity },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, variant: "destructive" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[1100px] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-gray-50/50">
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="font-bold text-[#003087]">PayPal</span> Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r flex-shrink-0 flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto md:overflow-y-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all whitespace-nowrap md:whitespace-normal",
                  isTabActive(tab.id) 
                    ? tab.variant === "destructive" 
                      ? "bg-red-50 text-red-900 border border-red-200" 
                      : "bg-white text-[#003087] shadow-sm border border-gray-200"
                    : tab.variant === "destructive" 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-muted-foreground hover:bg-gray-200/50 hover:text-foreground"
                )}
              >
                <tab.icon className={cn("h-4 w-4 flex-shrink-0", 
                  isTabActive(tab.id) && tab.variant !== "destructive" ? "text-[#003087]" : ""
                )} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
            <div className="max-w-2xl mx-auto pb-10">
              
              {isTabActive("general") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">General Settings</h2>
                  </div>
                  <Paypal_General_Form method={method} config={paypalConfig} />
                </div>
              )}

              {isTabActive("methods") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">Connection Settings</h2>
                  </div>
                  <Paypal_Connection_Tabs config={paypalConfig} methodId={method.id} />
                </div>
              )}

              {isTabActive("webhooks") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">Webhook Settings</h2>
                  </div>
                  <Paypal_Webhook_Tab config={paypalConfig} methodId={method.id} />
                </div>
              )}

              {isTabActive("express") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">Smart Buttons</h2>
                  </div>
                  <Paypal_SmartButtons method={method} config={paypalConfig} />
                </div>
              )}

              {isTabActive("paylater") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">Pay Later Messaging</h2>
                  </div>
                  <Paypal_PayLater method={method} config={paypalConfig} />
                </div>
              )}

              {isTabActive("advanced") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">Advanced Options</h2>
                  </div>
                  <Paypal_Advanced method={method} config={paypalConfig} />
                </div>
              )}

              {isTabActive("danger") && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                  </div>
                  <Paypal_Danger_Zone methodId={method.id} />
                </div>
              )}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}