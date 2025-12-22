"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, CreditCard, Sliders, Activity, Webhook } from "lucide-react"
import { PaymentMethodWithConfig } from "@/app/admin/settings/payments/types"
import { cn } from "@/lib/utils"

// 👇 Hook বাদ দিয়েছি, এখন সরাসরি কম্পোনেন্ট ইম্পোর্ট করছি
import { Stripe_General_Form } from "./Stripe_General_Form"
import { Stripe_Advanced } from "./Stripe_Advanced"
import { Stripe_Webhook_Config } from "./Stripe_Webhook_Config"
import { Stripe_Connection_Card } from "./Stripe_Connection_Card"

interface StripeMainModalProps {
  method: PaymentMethodWithConfig
}

// 👇 টাইপটি এখানেই ডিফাইন করে দিলাম (আলাদা ফাইলের দরকার নেই)
type TabType = "general" | "methods" | "advanced" | "webhooks"

export const Stripe_Main_Modal = ({ method }: StripeMainModalProps) => {
  const [open, setOpen] = useState(false)
  
  // 👇 CHANGE: Hook এর বদলে সরাসরি useState ব্যবহার করছি
  const [activeTab, setActiveTab] = useState<TabType>("general")

  const stripeConfig = method.stripeConfig
  if (!stripeConfig) return null

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: Sliders },
    { id: "methods", label: "Connection", icon: CreditCard },
    { id: "advanced", label: "Advanced", icon: Activity },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-gray-50/50">
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="font-bold text-[#635BFF]">Stripe</span> Configuration
          </DialogTitle>
        </DialogHeader>

        {/* Body Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-60 bg-gray-50/50 border-b md:border-b-0 md:border-r flex-shrink-0 flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto md:overflow-y-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} // 👈 সরাসরি স্টেট আপডেট করছি
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all whitespace-nowrap md:whitespace-normal",
                  activeTab === tab.id 
                    ? "bg-white text-[#635BFF] shadow-sm border border-gray-200" 
                    : "text-muted-foreground hover:bg-gray-200/50 hover:text-foreground"
                )}
              >
                <tab.icon className={cn("h-4 w-4 flex-shrink-0", activeTab === tab.id ? "text-[#635BFF]" : "")} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white relative">
            <div className="max-w-2xl mx-auto pb-10">
              
              {/* General Tab */}
              {activeTab === "general" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">General Settings</h2>
                    <p className="text-sm text-muted-foreground">Manage payment status and display options.</p>
                  </div>
                  <Stripe_General_Form method={method} config={stripeConfig} />
                </div>
              )}
              
              {/* Connection Tab */}
              {activeTab === "methods" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-6 pb-4 border-b">
                      <h2 className="text-lg font-semibold">Connection</h2>
                      <p className="text-sm text-muted-foreground">Link your Stripe account to start processing.</p>
                    </div>
                  <Stripe_Connection_Card config={stripeConfig} methodId={method.id} />
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === "advanced" && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-6 pb-4 border-b">
                      <h2 className="text-lg font-semibold">Advanced Processing</h2>
                      <p className="text-sm text-muted-foreground">Fine-tune how payments are captured.</p>
                    </div>
                  <Stripe_Advanced method={method} config={stripeConfig} />
                </div>
              )}

              {/* Webhooks Tab */}
              {activeTab === "webhooks" && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-6 pb-4 border-b">
                      <h2 className="text-lg font-semibold">Webhook Status</h2>
                      <p className="text-sm text-muted-foreground">Real-time event synchronization.</p>
                    </div>
                  <Stripe_Webhook_Config methodId={method.id} config={stripeConfig} />
                </div>
              )}

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}