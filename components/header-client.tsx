// components/header-client.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from "next-auth/react"; 
import MiniCart from '@/components/MiniCart'; 
import Image from 'next/image';
import { searchProductsAction } from '@/app/actions/frontend/home/searchProductsAction'; 
import {
  IoSearch,
  IoMenu,
  IoClose,
  IoPersonOutline,
  IoLogOutOutline,
  IoTrendingUpOutline,
  IoPersonCircleOutline,
  IoSpeedometerOutline,
  IoChevronDown,
  IoChevronUp,
  IoHeartOutline,
  IoLocationOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoStorefrontOutline,
  IoGridOutline,
  IoShieldCheckmarkOutline,
  IoOpenOutline,
  IoBagHandleOutline,
  IoSettingsOutline,
  IoPeopleOutline,
  IoBarChartOutline,
} from "react-icons/io5";

type SubNavItem = {
  path: string;
  label: string;
  tag?: string; 
};

type NavItem = {
  path: string;
  label: string;
  subItems?: SubNavItem[]; 
};

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  image?: {
    sourceUrl: string;
  };
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home' },
  { 
    path: '/bikes', 
    label: 'Bikes',
    subItems: [
      { path: '/product/ebike-for-kids-12-inch-electric-bike-ages-2-5', label: '12" Electric Bike', tag: 'Ages 2-5' },
      { path: '/product/ebike-for-sale-16-inch-gobike-ages-5-9', label: '16" Electric Bike', tag: 'Ages 5-9' },
      { path: '/product/20-inch-electric-bikes-for-sale-ebike-for-kids', label: '20" Electric Bike', tag: 'Ages 8-14' },
      { path: '/product/gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13', label: '24" Electric Bike', tag: 'Ages 13+' },
    ]
  },
  { 
    path: '/electric-bike-parts', 
    label: 'Spare Parts',
    subItems: [
      { path: '/electric-bike-parts/battery', label: 'Electric Bike Batteries' },
      { path: '/electric-bike-parts/tyre-tube', label: 'Electric Bike Tyres and Tube' },
      { path: '/electric-bike-parts/motors',    label: 'Electric Bike Motors'         },

    ]
  },
  { path: '/apparel', label: 'Apparel' },
  { path: '/shop', label: 'Shop' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/faq', label: 'FAQ' },
  { 
    path: '/kids-ebike-hub', 
    label: 'Hub & Blog',
    subItems: [
      { path: '/kids-ebike-hub', label: 'The GoBike Hub', tag: 'Videos & News' },
      { path: '/blog', label: 'Official Blog', tag: 'Guides & Tips' },
    ]
  },
];

interface InitialUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface HeaderClientProps {
  isAffiliate: boolean;
  userRole?: string | null;
  initialUser?: InitialUser | null;
}

export default function HeaderClient({ isAffiliate, userRole, initialUser }: HeaderClientProps) {
  const { cartItems, isMiniCartOpen, openMiniCart, closeMiniCart } = useCart();
  const { data: session } = useSession();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<Record<string, boolean>>({});
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  // 🛡️ Live Inline Search States (Desktop)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  // Server-passed initialUser avoids first-render flash; session takes over after hydration
  const user = session?.user ?? initialUser;

  const normalizedRole = userRole?.toUpperCase() || '';
  const isStaffRole    = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(normalizedRole);
  const isEditorRole   = ['EDITOR', 'SUPPORT'].includes(normalizedRole);
  const isAffiliateRole = normalizedRole === 'AFFILIATE';
  const isAdminRole    = isStaffRole; // backward compat

  const closeAllOverlays = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsAuthDropdownOpen(false);
    setIsSearchFocused(false);
  }

  // 🛡️ Debounced Live Search API Call inside Header
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchProductsAction(searchTerm);
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms Debounce limit to protect server

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Click Outside Event Listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAuthDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false); // 🛡️ Closes the live search dropdown when clicked outside
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsAuthDropdownOpen(!isAuthDropdownOpen);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    closeAllOverlays();
  };

  const openMobileMenusRef = useRef<Record<string, boolean>>({});

  const toggleMobileMenu = (path: string) => {
    setOpenMobileMenus(prev => {
      const next = { ...prev, [path]: !prev[path] };
      openMobileMenusRef.current = next;
      return next;
    });
  };

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GoBike Australia",
    "url": SITE,
    "logo": `${SITE}/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp`
  };

  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": navItems.map((item, index) => ({
      "@type": "SiteNavigationElement",
      "position": index + 1,
      "name": item.label,
      "url": `${SITE}${item.path}`
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }} />

      <header className="bg-white border-b border-[#eaeaea] sticky top-[55px] z-50 transition-[top] duration-300 ease-in-out md:top-[48px] shadow-md">
        
        {/* Top Main Bar (Logo, Nav, Icons) */}
        <div className="max-w-[1400px] mx-auto px-6 flex pb-2 pt-3 lg:grid lg:grid-cols-3 items-center justify-between relative ">
          
          <div className="flex flex-1 lg:flex-none items-center justify-start">
            <button 
                onClick={() => setIsMenuOpen(true)} 
                className="flex lg:hidden bg-transparent border-none cursor-pointer p-2 text-[#333] items-center mr-2"
                aria-label="Open Mobile Menu"
                aria-expanded={isMenuOpen} 
            >
                <IoMenu size={35} />
            </button>
            <div className="hidden lg:block">
              <Link href="/" className="flex items-center no-underline" aria-label="GoBike Home">
                  <Image 
                    src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp" 
                    alt="GoBike Australia Logo" 
                    width={1846} 
                    height={417} 
                    priority 
                    className="h-[60px] w-auto max-w-full" 
                  />
              </Link>
            </div>
          </div>

          <div className="block lg:hidden absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="flex items-center no-underline" aria-label="GoBike Home">
               <Image 
                src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp" 
                alt="GoBike Australia Logo" 
                width={1846} 
                height={417} 
                priority 
                className="h-[50px] w-auto max-w-full" 
               />
            </Link>
          </div>
          
          {/* Main Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 xl:gap-7 items-center justify-self-center" aria-label="Main Navigation">
            {navItems.map((item) => (
              <div key={item.path} className="relative group">
                <Link 
                    href={item.path} 
                    className={`no-underline text-[15px] xl:text-[18px] font-medium transition-colors duration-200 ease-in-out flex items-center gap-1 hover:text-black hover:font-bold whitespace-nowrap ${pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/') ? 'text-black font-bold' : 'text-[#353535]'}`}
                    aria-haspopup={item.subItems ? "true" : "false"}
                >
                    {item.label}
                    {item.subItems && <IoChevronDown size={14} className="mt-0.5 group-hover:rotate-180 transition-transform duration-200" aria-hidden="true" />}
                </Link>

                {item.subItems && (
                  <div className="absolute left-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="bg-white border border-[#eaeaea] shadow-[0_10px_20px_rgba(0,0,0,0.05)] rounded-md py-2 px-1 flex flex-col min-w-[220px]">
                      {item.subItems.map((subItem) => (
                        <Link 
                          key={subItem.path} 
                          href={subItem.path}
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-[#353535] hover:bg-[#f8f9fa] hover:text-black hover:font-semibold rounded transition-colors no-underline whitespace-nowrap"
                        >
                          <span>{subItem.label}</span>
                          {subItem.tag && <span className="text-xs text-gray-400 font-normal ml-6">{subItem.tag}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex flex-1 lg:flex-none items-center justify-end gap-1 justify-self-end">

            {/* Cart Icon */}
            <button
              className="bg-transparent border-none cursor-pointer relative text-[#333] p-2 hover:text-black transition-colors"
              onClick={openMiniCart}
              aria-label="Open Shopping Cart"
            >
              <IoBagHandleOutline size={26} aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-black text-white rounded-full h-[18px] w-[18px] flex items-center justify-center text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Account Dropdown — Desktop only */}
            <div className="relative hidden lg:block" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer px-2 py-1.5 text-[#333] hover:text-black transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Account Menu"
                aria-haspopup="true"
                aria-expanded={isAuthDropdownOpen}
              >
                {user ? (
                  <>
                    {user.image ? (
                      <Image src={user.image} alt={user.name || 'Account'} width={32} height={32} className="rounded-full w-8 h-8 object-cover ring-2 ring-gray-200" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white ${isStaffRole ? 'bg-[#0f172a]' : isEditorRole ? 'bg-[#1e40af]' : isAffiliateRole ? 'bg-[#5b21b6]' : 'bg-[#374151]'}`}>
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-[13px] font-medium hidden xl:block max-w-[90px] truncate">
                      Hi, {user.name?.split(' ')[0] || 'Account'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <IoPersonOutline size={18} className="text-gray-500" />
                    </div>
                    <span className="text-[13px] font-medium hidden xl:block text-gray-600">Account</span>
                  </>
                )}
                {isAuthDropdownOpen ? <IoChevronUp size={13} className="text-gray-400" /> : <IoChevronDown size={13} className="text-gray-400" />}
              </button>

              {isAuthDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden">

                  {/* ── NOT LOGGED IN ── */}
                  {!user && (
                    <>
                      <div className="px-5 pt-5 pb-4">
                        <p className="text-[15px] font-bold text-[#111] m-0">Welcome to GoBike</p>
                        <p className="text-[12px] text-gray-400 m-0 mt-1">Sign in to track orders & access your account</p>
                      </div>
                      <div className="px-4 pb-4 flex flex-col gap-2">
                        <Link href="/sign-in" onClick={closeAllOverlays} className="w-full bg-[#111] text-white text-center py-2.5 rounded-xl text-[13px] font-semibold no-underline hover:bg-[#222] transition-colors block">
                          Sign In
                        </Link>
                        <Link href="/sign-up" onClick={closeAllOverlays} className="w-full border border-gray-200 text-[#111] text-center py-2.5 rounded-xl text-[13px] font-semibold no-underline hover:bg-gray-50 transition-colors block">
                          Create Account
                        </Link>
                      </div>
                      <div className="mx-4 border-t border-gray-100 pt-3 pb-4">
                        <Link href="/affiliate-portal" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#444] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                            <IoTrendingUpOutline size={17} className="text-violet-600" />
                          </div>
                          <div>
                            <p className="m-0 font-semibold text-[#111] text-[13px]">Affiliate Program</p>
                            <p className="m-0 text-[11px] text-gray-400">Earn commissions on referrals</p>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}

                  {/* ── SUPER_ADMIN / ADMIN / MANAGER ── */}
                  {user && isStaffRole && (
                    <>
                      {/* Dark header */}
                      <div className="px-4 py-4 bg-[#0f172a] flex items-center gap-3">
                        {user.image ? (
                          <Image src={user.image} alt="" width={40} height={40} className="rounded-xl w-10 h-10 object-cover shrink-0 border border-white/20" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                            {(user.name || 'A')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-white m-0 truncate">{user.name || 'Admin'}</p>
                          <span className="inline-block text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full mt-0.5">{normalizedRole.replace('_', ' ')}</span>
                        </div>
                        <IoShieldCheckmarkOutline size={20} className="text-white/40 ml-auto shrink-0" />
                      </div>
                      {/* Admin links */}
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Administration</p>
                        <Link href="/admin" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#111] font-semibold hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoSpeedometerOutline size={16} className="text-slate-700" />
                          </div>
                          Admin Dashboard
                        </Link>
                        <Link href="/admin/orders" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoReceiptOutline size={16} className="text-slate-600" />
                          </div>
                          Manage Orders
                        </Link>
                        <Link href="/admin/products" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoGridOutline size={16} className="text-slate-600" />
                          </div>
                          Manage Products
                        </Link>
                        <Link href="/admin/customers" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoPeopleOutline size={16} className="text-slate-600" />
                          </div>
                          Customers
                        </Link>
                        <Link href="/admin/marketing" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoBarChartOutline size={16} className="text-slate-600" />
                          </div>
                          Marketing
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <Link href="/" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                              <IoOpenOutline size={15} className="text-slate-600" />
                            </div>
                            View Store
                          </Link>
                        </div>
                      </div>
                      <div className="mx-4 border-t border-gray-100 py-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 text-left bg-transparent border-none cursor-pointer transition-colors">
                          <IoLogOutOutline size={16} className="shrink-0" />Sign Out
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── EDITOR / SUPPORT ── */}
                  {user && isEditorRole && (
                    <>
                      <div className="px-4 py-4 bg-[#1e3a5f] flex items-center gap-3">
                        {user.image ? (
                          <Image src={user.image} alt="" width={40} height={40} className="rounded-xl w-10 h-10 object-cover shrink-0 border border-white/20" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                            {(user.name || 'S')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-white m-0 truncate">{user.name}</p>
                          <span className="inline-block text-[10px] bg-sky-400/20 text-sky-300 font-bold px-2 py-0.5 rounded-full mt-0.5">{normalizedRole}</span>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link href="/admin" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#111] font-semibold hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <IoSpeedometerOutline size={16} className="text-blue-700" />
                          </div>
                          Staff Panel
                        </Link>
                        <Link href="/admin/orders" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <IoReceiptOutline size={16} className="text-blue-600" />
                          </div>
                          Manage Orders
                        </Link>
                        <Link href="/" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <IoOpenOutline size={15} className="text-blue-600" />
                          </div>
                          View Store
                        </Link>
                      </div>
                      <div className="mx-4 border-t border-gray-100 py-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 text-left bg-transparent border-none cursor-pointer transition-colors">
                          <IoLogOutOutline size={16} />Sign Out
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── CUSTOMER / SUBSCRIBER / AFFILIATE ── */}
                  {user && !isStaffRole && !isEditorRole && (
                    <>
                      {/* User header */}
                      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
                        {user.image ? (
                          <Image src={user.image} alt="" width={44} height={44} className="rounded-full w-11 h-11 object-cover shrink-0 ring-2 ring-gray-100" />
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-bold text-white shrink-0 ${isAffiliateRole ? 'bg-[#5b21b6]' : 'bg-[#374151]'}`}>
                            {(user.name || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-bold text-[#111] m-0 truncate max-w-[150px]">{user.name || 'Customer'}</p>
                            {isAffiliateRole && (
                              <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Affiliate</span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-400 m-0 truncate max-w-[200px]">{user.email}</p>
                        </div>
                      </div>

                      {/* Affiliate Dashboard — highlighted at top */}
                      {(isAffiliateRole || isAffiliate) && (
                        <div className="px-2 pt-2">
                          <Link href="/affiliates" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-violet-700 font-semibold bg-violet-50 hover:bg-violet-100 no-underline transition-colors">
                            <div className="w-8 h-8 bg-violet-200 rounded-lg flex items-center justify-center shrink-0">
                              <IoTrendingUpOutline size={16} className="text-violet-700" />
                            </div>
                            Affiliate Dashboard
                          </Link>
                        </div>
                      )}

                      {/* Customer links */}
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">My Account</p>
                        <Link href="/my-account" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoPersonOutline size={16} className="text-gray-600" />
                          </div>
                          Account Settings
                        </Link>
                        <Link href="/my-account?tab=orders" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoReceiptOutline size={16} className="text-gray-600" />
                          </div>
                          My Orders
                        </Link>
                        <Link href="/my-account?tab=wishlist" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoHeartOutline size={16} className="text-gray-600" />
                          </div>
                          Wishlist
                        </Link>
                        <Link href="/my-account?tab=addresses" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoLocationOutline size={16} className="text-gray-600" />
                          </div>
                          Saved Addresses
                        </Link>
                        <Link href="/my-account?tab=wallet" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#333] hover:bg-gray-50 no-underline transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <IoWalletOutline size={16} className="text-gray-600" />
                          </div>
                          Wallet & Credits
                        </Link>
                        {!isAffiliate && !isAffiliateRole && (
                          <Link href="/affiliates/register" onClick={closeAllOverlays} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-violet-600 font-medium hover:bg-violet-50 no-underline transition-colors">
                            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                              <IoTrendingUpOutline size={16} className="text-violet-600" />
                            </div>
                            Affiliate Program
                          </Link>
                        )}
                      </div>
                      <div className="mx-4 border-t border-gray-100 py-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 text-left bg-transparent border-none cursor-pointer transition-colors">
                          <IoLogOutOutline size={16} className="shrink-0" />Sign Out
                        </button>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar — desktop only; mobile search is inside the sidebar drawer */}
        <div className="hidden lg:flex w-full max-w-[1400px] mx-auto px-6 pb-3 pt-1 relative" ref={searchRef}>
          <div className="w-full lg:max-w-[680px] lg:mx-auto relative">
            <div className="w-full flex items-center gap-2.5 bg-[#f4f4f5] border border-transparent rounded-full px-4 py-2.5 focus-within:bg-white focus-within:border-[#d1d5db] focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
              <IoSearch size={17} className="text-gray-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search bikes, parts, apparel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-transparent border-none outline-none text-[#111] placeholder-gray-400 text-[14px] font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setIsSearchFocused(false); }}
                  className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-black transition-colors flex items-center shrink-0 p-0.5"
                  aria-label="Clear search"
                >
                  <IoClose size={16} />
                </button>
              )}
            </div>

            {/* Live results dropdown */}
            {isSearchFocused && searchTerm.length >= 3 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl z-50 overflow-hidden max-h-[380px] overflow-y-auto">
                {searchLoading && (
                  <div className="p-5 flex items-center justify-center gap-3 text-[13px] text-gray-400">
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </div>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <div className="flex flex-col py-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">Products</p>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={() => { setSearchTerm(''); setIsSearchFocused(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors no-underline text-[#111] border-b border-gray-50 last:border-0"
                      >
                        <Image
                          src={product.image?.sourceUrl || '/placeholder.png'}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-[40px] h-[40px] object-cover rounded-lg shrink-0"
                        />
                        <span className="font-semibold text-[14px] leading-snug">{product.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-[13px] text-gray-500 font-medium">No results for <span className="text-[#111]">&ldquo;{searchTerm}&rdquo;</span></p>
                    <p className="text-[11px] text-gray-400 mt-1">Try a different keyword</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </header>

      {/* MOBILE MENU */}
      <div 
        className={`fixed top-0 left-0 w-[320px] h-[100dvh] bg-white z-[1001] transition-transform duration-300 ease-in-out flex flex-col px-4 pt-4 pb-3 shadow-[5px_0_15px_rgba(0,0,0,0.1)] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
          {/* Mobile menu header: inline search + close */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#f0f0f0]">
            <div className="flex-1 flex items-center gap-2 bg-[#f4f4f5] rounded-full px-3 py-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 transition-all">
              <IoSearch size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setIsMobileSearchActive(true); }}
                onFocus={() => setIsMobileSearchActive(true)}
                className="w-full bg-transparent border-none outline-none text-[13px] text-[#333] placeholder-gray-400 font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setIsMobileSearchActive(false); }}
                  className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-black p-0"
                  aria-label="Clear"
                >
                  <IoClose size={14} />
                </button>
              )}
            </div>
            <button
              className="bg-transparent border-none cursor-pointer text-[#333] flex items-center p-1.5 shrink-0"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close Mobile Menu"
            >
              <IoClose size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Mobile inline search results */}
          {isMobileSearchActive && searchTerm.length >= 3 && (
            <div className="mb-3 bg-[#f9f9f9] rounded-xl overflow-hidden max-h-[240px] overflow-y-auto border border-gray-100">
              {searchLoading && (
                <div className="p-3 text-[12px] text-gray-400 text-center">Searching...</div>
              )}
              {!searchLoading && searchResults.length > 0 && searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => { closeAllOverlays(); setSearchTerm(''); setIsMobileSearchActive(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-0 no-underline hover:bg-white transition-colors"
                >
                  <Image
                    src={product.image?.sourceUrl || '/placeholder.png'}
                    alt={product.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-cover rounded-lg shrink-0"
                  />
                  <span className="text-[13px] font-semibold text-[#111] leading-tight">{product.name}</span>
                </Link>
              ))}
              {!searchLoading && searchResults.length === 0 && (
                <div className="p-3 text-[12px] text-gray-400 text-center">No results for &ldquo;{searchTerm}&rdquo;</div>
              )}
            </div>
          )}
            
            <nav className="flex flex-col gap-0 flex-grow overflow-y-auto" aria-label="Mobile Navigation">
                {navItems.map((item) => (
                    <div key={item.path} className="w-full">
                        <div className="flex items-center justify-between border-b border-[#ececec]">
                            {item.subItems ? (
                              openMobileMenus[item.path] ? (
                                // Submenu open → Link so progress bar fires on click
                                <Link
                                  href={item.path}
                                  className={`text-[1rem] font-medium no-underline flex items-center gap-3 bg-transparent w-full text-left cursor-pointer py-2.5 hover:text-black hover:font-bold ${pathname === item.path || pathname.startsWith(item.path + '/') ? 'text-black font-bold' : 'text-[#333]'}`}
                                  onClick={closeAllOverlays}
                                >
                                  {item.label === 'Contact' ? 'Contact us' : item.label}
                                </Link>
                              ) : (
                                // Submenu closed → button so no progress bar on expand
                                <button
                                  className={`text-[1rem] font-medium flex items-center gap-3 bg-transparent w-full text-left cursor-pointer py-2.5 hover:text-black hover:font-bold border-none ${pathname === item.path || pathname.startsWith(item.path + '/') ? 'text-black font-bold' : 'text-[#333]'}`}
                                  onClick={() => toggleMobileMenu(item.path)}
                                >
                                  {item.label === 'Contact' ? 'Contact us' : item.label}
                                </button>
                              )
                            ) : (
                            <Link
                                href={item.path}
                                className={`text-[1rem] font-medium no-underline flex items-center gap-3 bg-transparent w-full text-left cursor-pointer py-2.5 hover:text-black hover:font-bold ${pathname === item.path ? 'text-black font-bold' : 'text-[#333]'}`}
                                onClick={closeAllOverlays}
                            >
                                {item.label === 'Contact' ? 'Contact us' : item.label}
                            </Link>
                            )}
                            {item.subItems && (
                                <button
                                  onClick={() => toggleMobileMenu(item.path)}
                                  className="p-3 text-[#333] cursor-pointer bg-transparent border-none"
                                  aria-label={`Toggle ${item.label} Submenu`}
                                  aria-expanded={!!openMobileMenus[item.path]}
                                  aria-controls={`mobile-submenu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                                >
                                  {openMobileMenus[item.path] ? <IoChevronUp size={20} aria-hidden="true" /> : <IoChevronDown size={20} aria-hidden="true" />}
                                </button>
                            )}
                        </div>

                        {item.subItems && (
                           <div 
                              id={`mobile-submenu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${openMobileMenus[item.path] ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                           >
                             <div className="flex flex-col pl-6 border-l-2 border-[#f0f0f0] ml-2 mb-2">
                               {item.subItems.map((subItem) => (
                                 <Link 
                                   key={subItem.path} 
                                   href={subItem.path} 
                                   className="py-2.5 text-[1.05rem] text-[#555] no-underline hover:text-black hover:font-semibold flex justify-between pr-4"
                                   onClick={closeAllOverlays}
                                 >
                                   <span>{subItem.label}</span>
                                   {subItem.tag && <span className="text-[0.85rem] text-gray-400">{subItem.tag}</span>}
                                 </Link>
                               ))}
                             </div>
                           </div>
                        )}
                    </div>
                ))}
            </nav>
          
          <div className="border-t border-[#f0f0f0] pt-2 mt-1">

            {user ? (
              <>
                {/* Mobile: User info strip — click to expand/collapse account links */}
                <button
                  onClick={() => setIsMobileAccountOpen(!isMobileAccountOpen)}
                  className={`flex items-center gap-2 w-full py-2 px-3 rounded-lg cursor-pointer border-none text-left transition-all ${isStaffRole ? 'bg-[#0f172a]' : isEditorRole ? 'bg-[#1e3a5f]' : 'bg-gray-100 hover:bg-gray-200'}`}
                  aria-expanded={isMobileAccountOpen}
                >
                  {user.image ? (
                    <Image src={user.image} alt="" width={34} height={34} className="rounded-full w-[34px] h-[34px] object-cover shrink-0" />
                  ) : (
                    <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 ${isStaffRole ? 'bg-white/10 border border-white/20' : isEditorRole ? 'bg-white/10 border border-white/20' : isAffiliateRole ? 'bg-[#5b21b6]' : 'bg-[#374151]'}`}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-bold m-0 truncate leading-tight ${(isStaffRole || isEditorRole) ? 'text-white' : 'text-[#111]'}`}>{user.name || 'Account'}</p>
                    <p className={`text-[10px] m-0 truncate leading-tight ${(isStaffRole || isEditorRole) ? 'text-white/50' : 'text-gray-500'}`}>{user.email}</p>
                  </div>
                  {(isStaffRole || isEditorRole) && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isStaffRole ? 'bg-amber-400/20 text-amber-300' : 'bg-sky-400/20 text-sky-300'}`}>
                      {normalizedRole.replace('_', ' ')}
                    </span>
                  )}
                  <div className={`shrink-0 ml-0.5 ${(isStaffRole || isEditorRole) ? 'text-white/60' : 'text-gray-400'}`}>
                    {isMobileAccountOpen ? <IoChevronUp size={15} aria-hidden="true" /> : <IoChevronDown size={15} aria-hidden="true" />}
                  </div>
                </button>

                {/* Collapsible account links */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileAccountOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="mt-1 bg-gray-50 rounded-xl border border-[#ececec] overflow-hidden">

                    {/* Staff roles */}
                    {(isStaffRole || isEditorRole) && (
                      <>
                        <Link href="/admin" onClick={closeAllOverlays} className="text-[0.95rem] font-bold text-[#111] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoSpeedometerOutline size={18} className="shrink-0 text-slate-600" /><span>{isStaffRole ? 'Admin Dashboard' : 'Staff Panel'}</span>
                        </Link>
                        <Link href="/admin/orders" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoReceiptOutline size={18} className="shrink-0 text-slate-500" /><span>Manage Orders</span>
                        </Link>
                        <Link href="/admin/products" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoGridOutline size={18} className="shrink-0 text-slate-500" /><span>Manage Products</span>
                        </Link>
                        {isStaffRole && (
                          <Link href="/admin/customers" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                            <IoPeopleOutline size={18} className="shrink-0 text-slate-500" /><span>Customers</span>
                          </Link>
                        )}
                        <Link href="/" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoStorefrontOutline size={18} className="shrink-0 text-slate-500" /><span>View Store</span>
                        </Link>
                      </>
                    )}

                    {/* Customer / Affiliate links */}
                    {!isStaffRole && !isEditorRole && (
                      <>
                        {(isAffiliateRole || isAffiliate) && (
                          <Link href="/affiliates" onClick={closeAllOverlays} className="text-[0.95rem] font-semibold text-violet-700 no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 bg-violet-50 hover:bg-violet-100 transition-colors">
                            <IoTrendingUpOutline size={18} className="shrink-0" /><span>Affiliate Dashboard</span>
                          </Link>
                        )}
                        <Link href="/my-account" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoPersonOutline size={18} className="shrink-0 text-gray-500" /><span>Account Settings</span>
                        </Link>
                        <Link href="/my-account?tab=orders" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoReceiptOutline size={18} className="shrink-0 text-gray-500" /><span>My Orders</span>
                        </Link>
                        <Link href="/my-account?tab=wishlist" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoHeartOutline size={18} className="shrink-0 text-gray-500" /><span>Wishlist</span>
                        </Link>
                        <Link href="/my-account?tab=addresses" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoLocationOutline size={18} className="shrink-0 text-gray-500" /><span>Saved Addresses</span>
                        </Link>
                        <Link href="/my-account?tab=wallet" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                          <IoWalletOutline size={18} className="shrink-0 text-gray-500" /><span>Wallet & Credits</span>
                        </Link>
                        {!isAffiliate && !isAffiliateRole && (
                          <Link href="/affiliates/register" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-violet-600 no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-violet-50 transition-colors">
                            <IoTrendingUpOutline size={18} className="shrink-0" /><span>Affiliate Program</span>
                          </Link>
                        )}
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="text-[0.95rem] font-medium text-gray-500 flex items-center gap-3 w-full text-left bg-transparent border-none cursor-pointer px-4 py-2.5 hover:bg-white hover:text-gray-700 transition-colors"
                    >
                      <IoLogOutOutline size={18} className="shrink-0" /><span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Not logged in — collapsible Account strip */}
                <button
                  onClick={() => setIsMobileAccountOpen(!isMobileAccountOpen)}
                  className="flex items-center gap-2 w-full py-2 px-3 rounded-lg cursor-pointer border-none text-left bg-gray-100 hover:bg-gray-200 transition-all"
                  aria-expanded={isMobileAccountOpen}
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                    <IoPersonOutline size={17} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-[#111] m-0 leading-tight">Account</p>
                    <p className="text-[10px] text-gray-500 m-0 leading-tight">Sign in or create account</p>
                  </div>
                  <div className="text-gray-400 shrink-0">
                    {isMobileAccountOpen ? <IoChevronUp size={15} /> : <IoChevronDown size={15} />}
                  </div>
                </button>

                {/* Collapsible links */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileAccountOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="mt-1 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <Link href="/sign-in" onClick={closeAllOverlays} className="text-[0.95rem] font-semibold text-[#111] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                      <IoPersonCircleOutline size={18} className="shrink-0 text-gray-600" /><span>Sign In</span>
                    </Link>
                    <Link href="/sign-up" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-[#333] no-underline flex items-center gap-3 border-b border-[#ececec] w-full px-4 py-2.5 hover:bg-white transition-colors">
                      <IoPersonOutline size={18} className="shrink-0 text-gray-500" /><span>Create Account</span>
                    </Link>
                    <Link href="/affiliate-portal" onClick={closeAllOverlays} className="text-[0.95rem] font-medium text-violet-600 no-underline flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white transition-colors">
                      <IoTrendingUpOutline size={18} className="shrink-0" /><span>Affiliate Program</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
      </div>
      
      {isMenuOpen && (
        <div 
            className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000]" 
            onClick={() => setIsMenuOpen(false)} 
            aria-label="Close Overlay"
        ></div>
      )}
      
      <MiniCart isOpen={isMiniCartOpen} onClose={closeMiniCart} />
    </>
  );
}