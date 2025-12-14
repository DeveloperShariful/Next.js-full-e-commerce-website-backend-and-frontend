// components/admin/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/actions/logout";
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  TicketPercent, BarChart3, Settings, LogOut, 
  ListTree, Tag, Box, FileText, ShieldCheck, 
  PenTool, MessageSquare, ScrollText, Files, 
  Image as ImageIcon, Star, Undo2, Megaphone, 
  User, ChevronUp
} from "lucide-react";

// Menu Config
const menuGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Categories", href: "/admin/categories", icon: ListTree },
      { name: "Attributes", href: "/admin/attributes", icon: Tag },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Inventory", href: "/admin/inventory", icon: Box },
      { name: "Media", href: "/admin/media", icon: ImageIcon },
    ]
  },
  {
    title: "Sales",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Invoices", href: "/admin/invoices", icon: FileText },
      { name: "Shipments", href: "/admin/shipments", icon: TruckIcon },
      { name: "Refunds", href: "/admin/refunds", icon: Undo2 },
    ]
  },
  {
    title: "Customers",
    items: [
      { name: "All Customers", href: "/admin/customers", icon: Users },
      { name: "Support Ticket", href: "/admin/support", icon: MessageSquare },
    ]
  },
  {
    title: "Marketing",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: TicketPercent },
      { name: "Banners & Ads", href: "/admin/banners", icon: Megaphone },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ]
  },
  
  {
    title: "System",
    items: [
      { name: "Staff & Roles", href: "/admin/staff", icon: ShieldCheck },
      { name: "Activity Logs", href: "/admin/logs", icon: ScrollText },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

function TruckIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  );
}

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  }
}

export default function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col flex-shrink-0 h-full border-r border-slate-800 transition-all duration-300">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-[#0f172a]">
          <Link href="/" className="flex items-center gap-2 font-bold text-white text-xl tracking-wide">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">GB</div>
            GoBike
          </Link>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? "bg-blue-600 text-white shadow-lg" 
                          : "hover:bg-slate-800 hover:text-white text-slate-400"
                      }`}
                    >
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Dynamic User Profile (Shopify Style) */}
        <div className="p-4 border-t border-slate-700 bg-[#0f172a] relative">
          
          {/* Pop-up Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                <div className="p-2 space-y-1">
                    <Link href="/admin/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition">
                        <User size={16}/> Your Profile
                    </Link>
                    <button 
                        onClick={() => logout()} 
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md transition text-left"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
          )}

          {/* User Button */}
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center justify-between w-full p-2 rounded-lg transition ${isUserMenuOpen ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
          >
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                   {user.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="text-left overflow-hidden w-28">
                    <p className="text-sm font-bold text-white truncate">{user.name || "Admin"}</p>
                    <p className="text-[10px] text-slate-400 truncate uppercase">{user.role?.replace('_', ' ')}</p>
                </div>
             </div>
             <ChevronUp size={16} className={`text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </aside>
  );
}