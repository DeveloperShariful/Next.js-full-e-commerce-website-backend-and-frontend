import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  TicketPercent, BarChart3, Settings, ListTree, 
  Tag, Box, FileText, ShieldCheck, 
  MessageSquare, ScrollText, Image as ImageIcon, 
  Star, Undo2, Megaphone, Truck 
} from "lucide-react";
import { Role } from "@prisma/client"; // Prisma Enum ব্যবহার করছি Type Safety এর জন্য

export interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  roles?: Role[]; 
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
      { name: "Shipments", href: "/admin/shipments", icon: Truck }, // Lucide Icon used
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
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Staff & Roles", href: "/admin/staff", icon: ShieldCheck, roles: [Role.SUPER_ADMIN] }, // Only Super Admin
      { name: "Activity Logs", href: "/admin/logs", icon: ScrollText, roles: [Role.SUPER_ADMIN] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    ]
  }
];