// File: app/(frontend)/my-account/_components/account-main-view.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  User, ShoppingBag, CreditCard, Home, Settings, Trophy, 
  HelpCircle, ShieldCheck, Heart, LogOut, Menu, X, Loader2 
} from "lucide-react";
import { signOut } from "next-auth/react";

// ✅ ALL TAB IMPORTS ENABLED & FIXED
import DashboardView from "./dashboard-view";
import OrdersView from "./orders-view";
import SubscriptionsView from "./subscriptions-view";
import WalletView from "./wallet-view";
import AddressesView from "./addresses-view";
import ProfileView from "./profile-view";
import TicketsView from "./tickets-view";
import WarrantyView from "./warranty-view";
import WishlistView from "./wishlist-view";

interface Props {
  initialData: any;
  activeTab: string;
}

export default function AccountMainView({ initialData, activeTab }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`/my-account?${params.toString()}`);
    });
  };

  // ✅ All Menu Items Mapped to active UI tabs
  const MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "wallet", label: "My Wallet", icon: CreditCard },
    { id: "addresses", label: "Addresses", icon: Home },
    { id: "profile", label: "Account Details", icon: User },
    { id: "tickets", label: "Support Tickets", icon: HelpCircle },
    { id: "warranty", label: "Warranty Claims", icon: ShieldCheck },
    { id: "wishlist", label: "Wishlist", icon: Heart },
  ];

  const handleLogout = async () => {
    if (confirm("Do you want to log out?")) {
      await signOut({ callbackUrl: "/" });
    }
  };

  const ActiveComponent = () => {
    if (!initialData) return null;

    switch (currentTab) {
      case "dashboard":
        return <DashboardView data={initialData} onTabChange={handleTabChange} />;
      case "orders":
        return <OrdersView initialOrders={initialData.orders} />;
      case "subscriptions":
        return <SubscriptionsView initialSubscriptions={initialData.subscriptions} />;
      case "wallet":
        return <WalletView data={initialData} />;
      case "addresses":
        return <AddressesView initialAddresses={initialData.addresses} />;
      case "profile":
        return <ProfileView initialUser={initialData.user} />;
      case "tickets":
        return <TicketsView initialTickets={initialData.tickets} />;
      case "warranty":
        return <WarrantyView initialClaims={initialData.warrantyClaims} />;
      case "wishlist":
        return <WishlistView initialWishlist={initialData.wishlist} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#f0f0f1] text-[#1d2327] font-sans">
      
      {/* Mobile Top Nav */}
      <div className="lg:hidden w-full bg-[#1d2327] border-b border-[#2c3338] h-12 px-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-semibold text-white flex items-center gap-2 text-[14px]">
           <User className="w-4 h-4"/> My Account
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#c3c4c7] hover:text-white">
           {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
        </button>
      </div>

      {/* WP Custom Customer Sidebar */}
      <aside className={cn(
        "fixed top-12 left-0 bottom-0 z-30 w-[180px] bg-[#1d2327] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:top-0 lg:z-0 overflow-y-auto custom-scrollbar shadow-xl lg:shadow-none pb-20 py-2 shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2 text-[13px] transition-colors group relative text-left",
                  isActive 
                    ? "bg-[#2271b1] text-white font-semibold" 
                    : "text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#a7aaad] group-hover:text-[#72aee6]")} />
                {item.label}
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-[#f78b8b] hover:text-red-500 hover:bg-[#2c3338] transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 w-full min-w-0 relative min-h-screen pb-10 bg-[#f0f0f1]">
        
        {/* Desktop Title Bar */}
        <header className="hidden lg:flex h-12 bg-white border-b border-[#c3c4c7] px-6 justify-between items-center sticky top-0 z-10 shadow-sm">
            <h1 className="text-[20px] font-normal text-[#1d2327] capitalize">
                {MENU_ITEMS.find(m => m.id === currentTab)?.label || "My Account"}
            </h1>
            <div className="text-[13px] font-semibold text-[#1d2327]">
                Welcome, {initialData.user?.name || "Customer"}
            </div>
        </header>

        {isPending && (
            <div className="absolute inset-0 bg-[#f0f0f1]/50 z-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2271b1]" />
            </div>
        )}

        <div className={cn("p-4 md:p-6 transition-opacity duration-200", isPending ? "opacity-50" : "opacity-100")}>
            <div className="max-w-[1000px] mx-auto">
                <ActiveComponent />
            </div>
        </div>
      </main>
    </div>
  );
}