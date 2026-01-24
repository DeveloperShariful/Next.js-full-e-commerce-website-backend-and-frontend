// File: app/(admin)/admin/settings/page.tsx

// File: app/(admin)/admin/settings/page.tsx

import Link from "next/link";
import { 
  Store, 
  Truck, 
  CreditCard, 
  ChevronRight,
  Settings,
  ShieldCheck,
  Globe,
  Mail,
  Megaphone,
  Users // ✅ ADDED USERS ICON FOR AFFILIATE
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsDashboard() {
  const settingsModules = [
    {
      title: "General Settings",
      description: "Store details, currency, social links, and system configurations.",
      icon: Store,
      href: "/admin/settings/general",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Shipping & Delivery",
      description: "Manage shipping zones, rates, and delivery methods.",
      icon: Truck,
      href: "/admin/settings/shipping",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Payments",
      description: "Configure payment gateways (Stripe, PayPal, COD, bKash).",
      icon: CreditCard,
      href: "/admin/settings/payments",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Email & Notifications",
      description: "Configure SMTP, customize email templates, and view logs.",
      icon: Mail,
      href: "/admin/settings/email",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Integrations & Marketing",
      description: "Connect Google GTM, Facebook Pixel, and Klaviyo settings.",
      icon: Megaphone,
      href: "/admin/settings/marketing-settings",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    // ✅ NEW AFFILIATE MODULE ADDED HERE
    {
      title: "Affiliate Program",
      description: "Manage referrals, MLM tiers, commission rules, and assets.",
      icon: Users,
      href: "/admin/settings/affiliate",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen font-sans text-slate-800">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-slate-700" /> 
          Settings
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Manage your store's configuration and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsModules.map((module) => (
          <Link key={module.href} href={module.href} className="group">
            <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-xl ${module.bgColor} ${module.color} transition-transform group-hover:scale-110`}>
                  <module.icon size={24} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-slate-900">
                    {module.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {module.description}
                </CardDescription>
                <div className="flex items-center text-sm font-semibold text-slate-600 group-hover:text-slate-900 group-hover:underline decoration-2 underline-offset-4">
                  Manage Settings <ChevronRight size={16} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Optional: Quick Stats or System Status at the bottom */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
        <div className="p-4 border rounded-lg bg-slate-50 flex items-center gap-4">
            <Globe className="text-slate-400" />
            <div>
                <p className="text-xs font-bold uppercase text-slate-500">Store Status</p>
                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Live
                </p>
            </div>
        </div>
        <div className="p-4 border rounded-lg bg-slate-50 flex items-center gap-4">
            <ShieldCheck className="text-slate-400" />
            <div>
                <p className="text-xs font-bold uppercase text-slate-500">System Version</p>
                <p className="text-sm font-medium text-slate-700">v1.0.2 (Beta)</p>
            </div>
        </div>
      </div>
    </div>
  );
}