// File: app/(frontend)/my-account/_components/account-main-view.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  User, ShoppingBag, CreditCard, Home,
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
  tabVisibility?: Record<string, boolean>;
}

// Core tabs are always shown regardless of admin settings.
const CORE_TABS = ["dashboard", "profile"];

export default function AccountMainView({ initialData, activeTab, tabVisibility }: Props) {
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

  // A tab is visible if it's a core tab, or admin hasn't switched it off.
  const isTabVisible = (id: string) =>
    CORE_TABS.includes(id) || tabVisibility?.[id] !== false;

  // Only render menu entries the admin has enabled.
  const visibleMenuItems = MENU_ITEMS.filter((item) => isTabVisible(item.id));

  // If a hidden tab is opened directly via URL, fall back to the dashboard.
  const effectiveTab = isTabVisible(currentTab) ? currentTab : "dashboard";

  const handleLogout = async () => {
    if (confirm("Do you want to log out?")) {
      await signOut({ callbackUrl: "/" });
    }
  };

  const ActiveComponent = () => {
    if (!initialData) return null;

    switch (effectiveTab) {
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
    <div className="flex flex-col w-full min-h-screen bg-[#f0f0f1] text-[#1d2327] font-sans">

      {/* My Account Header — full width, both mobile & desktop */}
      <div className="w-full bg-[#1d2327] border-b border-[#2c3338] h-12 px-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-semibold text-white flex items-center gap-2 text-[14px]">
          <User className="w-4 h-4" /> My Account
          <span className="hidden lg:inline text-[#a7aaad] font-normal text-[13px]">
            / {MENU_ITEMS.find(m => m.id === effectiveTab)?.label || "Dashboard"}
          </span>
        </span>
        {/* Mobile: hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-[#c3c4c7] hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Desktop: welcome */}
        <span className="hidden lg:block text-[13px] text-[#a7aaad]">
          Welcome, {initialData.user?.name || "Customer"}
        </span>
      </div>

      {/* Content area: relative on mobile (for absolute sidebar), flex-row on desktop */}
      <div className="relative flex-1 lg:flex lg:flex-row">

        {/* Backdrop — mobile only, within content area */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden absolute inset-0 z-30 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          // Mobile: absolute overlay, height = content only (no bottom-0)
          "absolute top-0 left-0 z-40 w-[200px] bg-[#1d2327] custom-scrollbar shadow-xl transform transition-transform duration-200",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: sticky in-flow with full height
          "lg:static lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto lg:w-[180px] lg:shrink-0 lg:shadow-none lg:translate-x-0 lg:z-0"
        )}>
          {/* Close button — mobile only */}
          <div className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-[#2c3338]">
            <span className="text-white font-semibold text-[13px] flex items-center gap-2">
              <User className="w-4 h-4" /> Menu
            </span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-[#c3c4c7] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-0.5 py-2 pb-20">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = effectiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2 text-[13px] transition-colors group text-left",
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

        {/* Main Content */}
        <main className="flex-1 min-w-0 relative pb-10 bg-[#f0f0f1]">

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
    </div>
  );
}