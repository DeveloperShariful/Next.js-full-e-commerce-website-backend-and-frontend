// app/(frontend)/header-footer/header-client.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from "next-auth/react"; // NextAuth Import
import SearchOverlay from '@/components/SearchOverlay'; // পাথ ঠিক করে নিবেন
import MiniCart from '@/components/MiniCart'; // পাথ ঠিক করে নিবেন
import Image from 'next/image';
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
  IoChevronUp   
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

    ]
  },
  { path: '/apparel', label: 'Apparel' },
  { path: '/shop', label: 'Shop' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/faq', label: 'FAQ' },
  { path: '/blog', label: 'Blog' },
];

interface HeaderClientProps {
  isAffiliate: boolean;
}

export default function HeaderClient({ isAffiliate }: HeaderClientProps) {
  const { cartItems, isMiniCartOpen, openMiniCart, closeMiniCart } = useCart();
  const { data: session } = useSession(); // NextAuth Session
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<Record<string, boolean>>({});
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Real-time Cart Count
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const user = session?.user;

  const closeAllOverlays = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsAuthDropdownOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAuthDropdownOpen(false);
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

  const toggleMobileMenu = (path: string) => {
    setOpenMobileMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // ★★★ SEO ENHANCEMENT 1: Organization Schema (Brand Logo & Details) ★★★
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GoBike Australia",
    "url": "https://gobikes.au",
    "logo": "https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids-1.webp"
  };

  // ★★★ SEO ENHANCEMENT 2: Site Navigation Schema (For Google Sitelinks) ★★★
  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": navItems.map((item, index) => ({
      "@type": "SiteNavigationElement",
      "position": index + 1,
      "name": item.label,
      "url": `https://gobikes.au${item.path}`
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }} />

      <header className="bg-white border-b border-[#eaeaea] py-1.3 sticky top-[55px] z-50 transition-[top] duration-300 ease-in-out md:top-[48px] shadow-md">
        
        <div className="max-w-[1400px] mx-auto px-6 flex pb-3 pt-3 lg:grid lg:grid-cols-3 items-center justify-between relative ">
          
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
          <div className="flex flex-1 lg:flex-none items-center justify-end gap-2 justify-self-end">
            <button 
                className="hidden lg:flex items-center gap-2 bg-transparent border-b border-[#d8d8d8] cursor-pointer px-2 pb-0.5 text-[#333] hover:border-black transition-colors" 
                onClick={() => setIsSearchOpen(true)} 
                aria-label="Open Search Bar"
            >
              <IoSearch size={22} aria-hidden="true" />
              <span className="text-sm font-medium">Search</span>
            </button>
            
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={toggleDropdown}
                    className="hidden lg:flex bg-transparent border-none cursor-pointer p-2 text-[#333] items-center gap-2 hover:text-black transition-colors font-medium text-sm whitespace-nowrap"
                    aria-label="My Account Menu"
                    aria-haspopup="true" 
                    aria-expanded={isAuthDropdownOpen} 
                >
                  <IoPersonOutline size={24} aria-hidden="true" />
                  {user && <span>My Account</span>}
                </button>

                {isAuthDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-50 overflow-hidden animate-fadeIn">

                        {!user && (
                            <>
                                <Link 
                                    href="/sign-in" 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#333] hover:bg-[#f8f9fa] border-b border-[#f0f0f0]"
                                    onClick={closeAllOverlays}
                                >
                                    <IoPersonCircleOutline size={20} />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Login / Register</span>
                                        <span className="text-xs text-gray-500">Access your orders</span>
                                    </div>
                                </Link>
                                <Link 
                                    href="/affiliate-portal" 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#333] hover:bg-[#f8f9fa]"
                                    onClick={closeAllOverlays}
                                >
                                    <IoTrendingUpOutline size={20} />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Affiliate Portal</span>
                                        <span className="text-xs text-gray-500">Earn commissions</span>
                                    </div>
                                </Link>
                            </>
                        )}

                        {user && (
                            <>
                                <div className="px-4 py-3 bg-gray-50 border-b border-[#f0f0f0]">
                                    <p className="text-xs text-gray-500">Signed in as</p>
                                    <p className="text-sm font-bold text-[#333] truncate">{user.name || user.email}</p>
                                </div>
                                
                                <Link 
                                    href="/account" 
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#333] hover:bg-[#f8f9fa] border-b border-[#f0f0f0]"
                                    onClick={closeAllOverlays}
                                >
                                    <IoPersonOutline size={18} />
                                    My Account
                                </Link>

                                {isAffiliate && (
                                    <Link 
                                        href="/affiliate/dashboard" 
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#333] hover:bg-[#f0f8ff] border-b border-[#f0f0f0]"
                                        onClick={closeAllOverlays}
                                    >
                                        <IoSpeedometerOutline size={18} className="text-blue-600"/>
                                        <span className="font-semibold text-blue-600">Affiliate Dashboard</span>
                                    </Link>
                                )}

                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                                >
                                    <IoLogOutOutline size={18} />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Cart Icon */}
            <button 
                className="bg-transparent border-none cursor-pointer relative text-[#333] p-2 hover:text-black transition-colors" 
                onClick={openMiniCart} 
                aria-label="Open Shopping Cart" 
            >
              <span className="text-[26px]" aria-hidden="true">🛒</span>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold">
                    {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div 
        className={`fixed top-0 left-0 w-[350px] h-[100dvh] bg-white z-[1001] transition-transform duration-300 ease-in-out flex flex-col p-6 shadow-[5px_0_15px_rgba(0,0,0,0.1)] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
          <div className="flex justify-between items-center mb-8 border-b border-[#f0f0f0] pb-4">
             <button 
                className="flex items-center gap-3 w-full bg-transparent border-none border-b border-[#e0e0e0] p-3 mr-4 text-[1.1rem] font-medium text-[#333] cursor-pointer text-left" 
                onClick={() => setIsSearchOpen(true) } 
                aria-label="Search Products"
             >
              <IoSearch size={22} aria-hidden="true" />
              <span>Search products</span>
            </button>
            <button 
                className="bg-transparent border-none cursor-pointer text-[#333] flex items-center p-2" 
                onClick={() => setIsMenuOpen(false)} 
                aria-label="Close Mobile Menu"
            >
                <IoClose size={28} aria-hidden="true" />
            </button>
          </div>
            
            <nav className="flex flex-col gap-2 flex-grow overflow-y-auto" aria-label="Mobile Navigation">
                {navItems.map((item) => (
                    <div key={item.path} className="w-full">
                        <div className="flex items-center justify-between border-b border-[#ececec]">
                            <Link 
                                href={item.path} 
                                className={`text-[1.2rem] font-medium no-underline flex items-center gap-3 bg-transparent w-full text-left cursor-pointer py-3 hover:text-black hover:font-bold ${pathname === item.path ? 'text-black font-bold' : 'text-[#333]'}`}
                                onClick={() => !item.subItems && closeAllOverlays()}
                            >
                                {item.label === 'Contact' ? 'Contact us' : item.label}
                            </Link>
                            
                            {item.subItems && (
                                <button 
                                  onClick={() => toggleMobileMenu(item.path)}
                                  className="p-3 text-[#333] cursor-pointer"
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
          
          <div className="border-t border-[#f0f0f0] pt-4 mt-6">

            {user ? (
                <>
                 <Link 
                    href="/account"
                    className="text-[1.2rem] font-medium text-[#333] no-underline flex items-center gap-3 bg-transparent border-b border-[#ececec] w-full text-left cursor-pointer p-0 hover:text-black hover:font-bold mb-4"
                    onClick={closeAllOverlays}
                 >
                    <IoPersonOutline aria-hidden="true" />
                    <span>My Account</span>
                 </Link>
                 
                 {isAffiliate && (
                    <Link 
                        href="/affiliate/dashboard"
                        className="text-[1.2rem] font-medium text-blue-600 no-underline flex items-center gap-3 bg-transparent border-b border-[#ececec] w-full text-left cursor-pointer p-0 hover:text-blue-800 hover:font-bold mb-4"
                        onClick={closeAllOverlays}
                    >
                        <IoSpeedometerOutline aria-hidden="true" />
                        <span>Affiliate Dashboard</span>
                    </Link>
                 )}

                 <button 
                    onClick={handleLogout}
                    className="text-[1.2rem] font-medium text-red-600 flex items-center gap-3 w-full text-left p-0 mt-2"
                 >
                    <IoLogOutOutline aria-hidden="true" />
                    <span>Logout</span>
                 </button>
                </>
            ) : (
                <div className="flex flex-col gap-4">
                    <Link 
                        href="/sign-in"
                        className="text-[1.2rem] font-medium text-[#333] no-underline flex items-center gap-3 bg-transparent border-b border-[#ececec] w-full text-left cursor-pointer p-0 hover:text-black hover:font-bold"
                        onClick={closeAllOverlays}
                    >
                        <IoPersonCircleOutline aria-hidden="true" />
                        <span>Login / Register</span>
                    </Link>
                     <Link 
                        href="/affiliate-portal"
                        className="text-[1.2rem] font-medium text-[#333] no-underline flex items-center gap-3 bg-transparent border-b border-[#ececec] w-full text-left cursor-pointer p-0 hover:text-black hover:font-bold"
                        onClick={closeAllOverlays}
                    >
                        <IoTrendingUpOutline aria-hidden="true" />
                        <span>Affiliate Portal</span>
                    </Link>
                </div>
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
      
      {/* Search Overlay & Mini Cart */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} aria-label="Close searchber"/>}
      <MiniCart isOpen={isMiniCartOpen} onClose={closeMiniCart} />
    </>
  );
}