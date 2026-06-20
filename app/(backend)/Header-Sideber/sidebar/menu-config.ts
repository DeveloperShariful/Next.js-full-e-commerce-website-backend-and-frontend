// File: app/(backend)/admin/Header-Sideber/sidebar/menu-config.ts

import {
  // আপনার আগের আইকনগুলো...
  LayoutDashboard, ShoppingCart, Package, Users,
  TicketPercent, BarChart3, Settings,
  FileText, ShieldCheck, MessageSquare, ScrollText,
  Undo2, Megaphone, Truck, MedalIcon, MessageCircle,
  Handshake, Link, Network, UserPlus, Facebook, Wallet, RefreshCw, Heart
} from "lucide-react";
import { Role } from "@prisma/client";


export interface SidebarItem {
  name: string;
  href: string;
  icon?: any;
  roles?: Role[];
  submenu?: { name: string; href: string; icon?: any ; roles?: Role[];}[]; 
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const sidebarConfig: SidebarGroup[] = [
  {
    title: "Overview",
    items: [
      { 
        name: "Dashboard", 
        href: "/admin", 
        icon: LayoutDashboard,
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] 
      },
    ]
  },
  {
    title: "Management",
    items: [
      { 
        name: "Products", // Parent Item
        href: "/admin/products",    // Double Click Link
        icon: Package,
        // 🚀 All Catalog Items are now children
        submenu: [
           { name: "All Products", href: "/admin/products", roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
           { name: "Categories", href: "/admin/categories", roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
           { name: "Brands", href: "/admin/brands" , roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
           { name: "Attributes", href: "/admin/attributes", roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
           { name: "Tags", href: "/admin/tags", roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
           { name: "Reviews", href: "/admin/reviews", roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
           { name: "Inventory", href: "/admin/inventory" , roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
           
        ]
      },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
      { name: "Media", href: "/admin/media" ,icon: MedalIcon , roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
      
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Invoices", href: "/admin/invoices", icon: FileText },
      { name: "Shipments", href: "/admin/shipments", icon: Truck },
      { name: "Refunds", href: "/admin/refunds", icon: Undo2, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]  },
      { name: "Support Ticket", href: "/admin/support", icon: MessageSquare },
      { name: "Warranty-Cliem", href: "/admin/warranty-claims", icon: Megaphone },
      { name: "Wallet", href: "/admin/wallet", icon: Wallet, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCw, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
    ]
  },
  {
    title: "Marketing",
    items: [ { 
        name: "Marketing", // Parent Item
        href: "/admin/marketing",    // Double Click Link
        icon: Package,
        submenu: [
         { name: "Klaviyo", href: "/admin/marketing/klaviyo", icon: Network, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
         { name: "Facebook", href: "/admin/marketing/facebook", icon: UserPlus, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
         { name: "Tag-Manager", href: "/admin/marketing/tag-manager", icon: Network, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
         { name: "Merchant Center", href: "/admin/marketing/merchant-center", icon: Link, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
         { name: "Search-Console", href: "/admin/marketing/search-console", icon: Network, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        ]
      },
      { name: "Coupons", href: "/admin/coupons", icon: TicketPercent , roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]},
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      { name: "Affiliate", href: "/admin/affiliate", icon: Handshake, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      { name: "Wishlist Report", href: "/admin/wishlist-report", icon: Heart, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
    ] 
  },
  {
    title: "System",
    items: [
      { name: "Users", href: "/admin/users", icon: ShieldCheck, roles: [Role.SUPER_ADMIN] },
      { name: "Activity Logs", href: "/admin/logs", icon: ScrollText, roles: [Role.SUPER_ADMIN] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    ]
  }
];