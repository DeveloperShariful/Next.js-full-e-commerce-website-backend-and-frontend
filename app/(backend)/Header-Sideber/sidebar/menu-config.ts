// File: app/(backend)/admin/Header-Sideber/sidebar/menu-config.ts

import { 
  // আপনার আগের আইকনগুলো...
  LayoutDashboard, ShoppingCart, Package, Users, 
  TicketPercent, BarChart3, Settings, 
  FileText, ShieldCheck, MessageSquare, ScrollText, 
  Undo2, Megaphone, Truck, MedalIcon, MessageCircle,
  Handshake, Link, Network, UserPlus
} from "lucide-react";
import { Role } from "@prisma/client";


export interface SidebarItem {
  name: string;
  href: string;
  icon?: any;
  roles?: Role[];
  // 🚀 New: Submenu support
  submenu?: { name: string; href: string; icon?: any }[]; 
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
           { name: "All Products", href: "/admin/products" },
           { name: "Categories", href: "/admin/categories" },
           { name: "Brands", href: "/admin/brands" },
           { name: "Attributes", href: "/admin/attributes" },
           { name: "Tags", href: "/admin/tags" },
           { name: "Reviews", href: "/admin/reviews" },
           { name: "Inventory", href: "/admin/inventory" },
           
        ]
      },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Media", href: "/admin/media" ,icon: MedalIcon },
      
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Invoices", href: "/admin/invoices", icon: FileText },
      { name: "Shipments", href: "/admin/shipments", icon: Truck },
      { name: "Refunds", href: "/admin/refunds", icon: Undo2 },
      { name: "Support Ticket", href: "/admin/support", icon: MessageSquare },
      { name: "Warranty-Cliem", href: "/admin/warranty-claims", icon: Megaphone },
    ]
  },
  {
    title: "Marketing",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: TicketPercent },
      { name: "Marketing-Integrations", href: "/admin/marketing", icon: Network, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      { name: "Affiliate", href: "/admin/affiliate", icon: Handshake, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      { name: "Merchant Center", href: "/admin/marketing/merchant-center", icon: Link, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
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