// File: app/(backend)/admin/Header-Sideber/sidebar/sidebar-item.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarItem as SidebarItemType } from "./menu-config";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarItemProps {
  item: SidebarItemType;
  isCollapsed?: boolean;
}

export function SidebarItem({ item, isCollapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const flyoutRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const isChildActive = item.submenu?.some(sub => pathname === sub.href);
  const isMainActive = pathname === item.href;

  const [isOpen, setIsOpen] = useState(isChildActive);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 46 });

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [pathname, isChildActive]);

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
      setFlyoutOpen(false);
    }
  }, [isCollapsed]);

  // Close flyout on outside click
  useEffect(() => {
    if (!flyoutOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node) &&
        linkRef.current && !linkRef.current.contains(e.target as Node)
      ) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [flyoutOpen]);

  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isParentActive = isMainActive || (hasSubmenu && (isOpen || isChildActive));

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      if (isCollapsed) {
        // Calculate screen position for fixed flyout
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setFlyoutPos({ top: rect.top, left: rect.right });
        setFlyoutOpen(prev => !prev);
      } else {
        setIsOpen(prev => !prev);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      router.push(item.href);
    }
  };

  return (
    <div className="select-none">

      {/* Main Item */}
      <Link
        ref={linkRef}
        href={hasSubmenu ? "#" : item.href}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={isCollapsed ? item.name : undefined}
        className={cn(
          "flex items-center justify-between px-3 py-[8px] text-[13px] font-normal transition-colors group cursor-pointer relative",
          isCollapsed && "justify-center px-0",
          isParentActive
            ? "bg-[#2c3338] text-white"
            : "text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]"
        )}
      >
        {/* Blue left border for active */}
        {isParentActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2271b1]" />
        )}

        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
          {item.icon && (
            <item.icon
              size={16}
              strokeWidth={1.5}
              className={cn(
                "shrink-0 transition-colors",
                isParentActive ? "text-[#72aee6]" : "text-[#a7aaad] group-hover:text-[#72aee6]"
              )}
            />
          )}
          {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
        </div>

        {/* Submenu arrow — expanded only */}
        {hasSubmenu && !isCollapsed && (
          <div className="text-[#a7aaad] shrink-0">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}

        {/* Blue dot — collapsed + child active */}
        {isCollapsed && isChildActive && (
          <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-[#72aee6]" />
        )}
      </Link>

      {/* ── Flyout — fixed, outside overflow bounds ───────────────────── */}
      {hasSubmenu && isCollapsed && flyoutOpen && (
        <div
          ref={flyoutRef}
          className="fixed z-[999] bg-[#191e23] border border-[#2c3338] shadow-2xl min-w-[160px] py-1 rounded-r animate-in slide-in-from-left-1 fade-in duration-150"
          style={{ top: flyoutPos.top, left: flyoutPos.left }}
        >
          {/* Header */}
          <div className="px-3 py-1.5 text-[11px] font-bold text-[#72aee6] uppercase tracking-wider border-b border-[#2c3338] mb-1">
            {item.name}
          </div>
          {item.submenu!.map((sub) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setFlyoutOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors",
                  isSubActive
                    ? "text-white font-semibold bg-[#2c3338]"
                    : "text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338]"
                )}
              >
                {sub.icon ? (
                  <sub.icon size={14} strokeWidth={1.5} className={cn("shrink-0", isSubActive ? "text-[#72aee6]" : "text-[#a7aaad]")} />
                ) : (
                  <span className={cn("w-1 h-1 rounded-full shrink-0", isSubActive ? "bg-[#72aee6]" : "bg-[#50575e]")} />
                )}
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Submenu — expanded mode ───────────────────────────────────── */}
      {hasSubmenu && isOpen && !isCollapsed && (
        <div className="bg-[#191e23] py-1 animate-in slide-in-from-top-1 fade-in duration-200">
          {item.submenu!.map((sub) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={cn(
                  "flex items-center gap-2 pl-6 pr-3 py-1.5 text-[13px] font-normal transition-colors relative",
                  isSubActive
                    ? "text-white font-medium"
                    : "text-[#c3c4c7] hover:text-[#72aee6]"
                )}
              >
                {sub.icon ? (
                  <sub.icon size={14} strokeWidth={1.5} className={cn("shrink-0", isSubActive ? "text-[#72aee6]" : "text-[#a7aaad]")} />
                ) : (
                  <span className={cn("w-1 h-1 rounded-full shrink-0", isSubActive ? "bg-[#72aee6]" : "bg-transparent")} />
                )}
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
