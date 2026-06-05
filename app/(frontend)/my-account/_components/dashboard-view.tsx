// File: app/(frontend)/my-account/_components/dashboard-view.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Trophy, ShoppingBag, Wallet, Mail, Settings, ArrowRight } from "lucide-react";

interface Props {
  data: any;
  onTabChange: (tab: string) => void;
}

export default function DashboardView({ data, onTabChange }: Props) {
  const { formatPrice } = useGlobalStore();
  
  const user = data.user || {};
  const walletBalance = data.wallet?.balance || 0;
  const totalOrders = data.orders?.length || 0;

  return (
    <div className="space-y-6 font-sans text-[#1d2327] animate-in fade-in duration-300">
      
      {/* Welcome Metabox */}
      <div className="bg-white border border-[#c3c4c7] p-6 shadow-sm">
        <h2 className="text-[20px] font-normal text-[#1d2327] m-0">
          Hello, <strong className="font-semibold text-[#2271b1]">{user.name}</strong>
        </h2>
        <p className="text-[13px] text-[#50575e] mt-2 leading-relaxed m-0">
          From your account dashboard you can view your <span className="text-[#2271b1] hover:underline cursor-pointer font-semibold" onClick={() => onTabChange("orders")}>recent orders</span>, 
          manage your <span className="text-[#2271b1] hover:underline cursor-pointer font-semibold" onClick={() => onTabChange("addresses")}>shipping and billing addresses</span>, 
          and edit your <span className="text-[#2271b1] hover:underline cursor-pointer font-semibold" onClick={() => onTabChange("profile")}>password and account details</span>.
        </p>
      </div>

      {/* WP Style Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders Widget */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 flex items-center justify-between group hover:border-[#8c8f94] transition-colors">
          <div>
            <span className="text-[11px] text-[#8c8f94] uppercase font-bold tracking-wider">Total Purchases</span>
            <h3 className="text-[24px] font-normal text-[#1d2327] m-0 mt-1 leading-none">{totalOrders}</h3>
          </div>
          <div className="p-2.5 bg-[#f6f7f7] border border-[#c3c4c7] text-[#50575e]">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Wallet Widget */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 flex items-center justify-between group hover:border-[#8c8f94] transition-colors">
          <div>
            <span className="text-[11px] text-[#8c8f94] uppercase font-bold tracking-wider">Store Credit</span>
            <h3 className="text-[24px] font-normal text-[#1d2327] m-0 mt-1 leading-none">{formatPrice(walletBalance)}</h3>
          </div>
          <div className="p-2.5 bg-[#f6f7f7] border border-[#c3c4c7] text-[#50575e]">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Support Tickets Widget */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 flex items-center justify-between group hover:border-[#8c8f94] transition-colors">
          <div>
            <span className="text-[11px] text-[#8c8f94] uppercase font-bold tracking-wider">Open Tickets</span>
            <h3 className="text-[24px] font-normal text-[#1d2327] m-0 mt-1 leading-none">
              {data.tickets?.filter((t: any) => t.status === "OPEN").length || 0}
            </h3>
          </div>
          <div className="p-2.5 bg-[#f6f7f7] border border-[#c3c4c7] text-[#50575e]">
            <Mail className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Links (WooCommerce Style) */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1]">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Quick Options</h3>
        </div>
        <div className="divide-y divide-[#f0f0f1]">
          <button onClick={() => onTabChange("orders")} className="w-full flex items-center justify-between p-4 text-left text-[13px] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] font-semibold group transition-colors">
             View Order History <ArrowRight className="w-4 h-4 text-[#8c8f94] group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => onTabChange("profile")} className="w-full flex items-center justify-between p-4 text-left text-[13px] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] font-semibold group transition-colors">
             Edit Profile & Passwords <ArrowRight className="w-4 h-4 text-[#8c8f94] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}