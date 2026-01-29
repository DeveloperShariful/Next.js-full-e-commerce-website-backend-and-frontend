// File: app/(admin)/admin/Header-Sideber/sidebar/menu-config.ts

import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  TicketPercent, BarChart3, Settings, 
  FileText, ShieldCheck, MessageSquare, ScrollText, 
  Undo2, Megaphone, Truck
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
           { name: "Media", href: "/admin/media" },
        ]
      },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Invoices", href: "/admin/invoices", icon: FileText },
      { name: "Shipments", href: "/admin/shipments", icon: Truck },
      { name: "Refunds", href: "/admin/refunds", icon: Undo2 },
      { name: "Support Ticket", href: "/admin/support", icon: MessageSquare },
    ]
  },
  {
    title: "Marketing",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: TicketPercent },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Staff & Roles", href: "/admin/staff", icon: ShieldCheck, roles: [Role.SUPER_ADMIN] },
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Activity Logs", href: "/admin/logs", icon: ScrollText, roles: [Role.SUPER_ADMIN] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    ]
  }
];